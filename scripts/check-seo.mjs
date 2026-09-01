#!/usr/bin/env node
/**
 * Search readiness, checked against a running site.
 *
 * The playbook's position is that search work belongs in engineering rather
 * than in a checklist somebody remembers, so these are the things that would
 * silently break indexing, asserted the way any other behaviour is asserted.
 *
 * Run against a started server:
 *
 *   npm run start &
 *   node scripts/check-seo.mjs http://127.0.0.1:3000
 *
 * It reads what the site actually serves. A build time check would pass on a
 * site whose content comes from a database, which this one's does.
 */

const origin = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

async function get(path, accept = "text/html") {
  const response = await fetch(`${origin}${path}`, { headers: { accept } });
  return { status: response.status, body: await response.text(), response };
}

/** The pages that must be indexable, and the one that must not be. */
const INDEXABLE = ["/", "/projects", "/about", "/experience", "/skills", "/resume", "/contact"];

async function main() {
  const status = await get("/api/v1/status", "application/json");
  const published = status.status === 200 && JSON.parse(status.body).published === true;
  notes.push(published ? "site is published" : "site is NOT published");

  // robots.txt
  const robots = await get("/robots.txt", "text/plain");
  if (robots.status !== 200) fail("robots.txt is missing");
  else if (published) {
    if (!/^sitemap:/im.test(robots.body)) fail("robots.txt names no sitemap");
    if (/^disallow:\s*\/\s*$/im.test(robots.body)) {
      fail("robots.txt disallows the whole site while the site is published");
    }
    for (const path of ["/admin", "/api/"]) {
      if (!robots.body.includes(path)) fail(`robots.txt does not disallow ${path}`);
    }
  }

  // sitemap.xml
  const sitemap = await get("/sitemap.xml", "application/xml");
  if (sitemap.status !== 200) fail("sitemap.xml is missing");
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  if (published) {
    if (urls.length === 0) fail("sitemap is empty while the site is published");

    const seen = new Set();
    for (const url of urls) {
      if (seen.has(url)) fail(`sitemap lists ${url} more than once`);
      seen.add(url);

      if (!URL.canParse(url)) fail(`sitemap contains a malformed URL: ${url}`);
      else if (!url.startsWith(origin) && !url.startsWith("https://")) {
        fail(`sitemap URL is not absolute or is on the wrong host: ${url}`);
      }
      // A disallowed address in a sitemap is a contradiction search engines
      // report as one.
      if (/\/(admin|api|ask|offline)(\/|$)/.test(new URL(url).pathname)) {
        fail(`sitemap lists a disallowed address: ${url}`);
      }
    }
    notes.push(`sitemap lists ${urls.length} address(es)`);
  }

  // Every page that should be indexable
  for (const path of published ? INDEXABLE : []) {
    const page = await get(path);
    if (page.status !== 200) {
      fail(`${path} returned ${page.status}`);
      continue;
    }

    const title = page.body.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    if (!title) fail(`${path} has no title`);
    else if (title.length < 10) fail(`${path} has a title of ${title.length} characters`);

    const description = page.body.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1];
    if (!description?.trim()) fail(`${path} has no meta description`);

    const canonical = page.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i)?.[1];
    if (!canonical) fail(`${path} has no canonical URL`);
    else if (!canonical.startsWith(origin)) {
      fail(`${path} has a canonical on the wrong host: ${canonical}`);
    }

    const headings = [...page.body.matchAll(/<h1[^>]*>/gi)];
    if (headings.length === 0) fail(`${path} has no h1`);
    if (headings.length > 1) fail(`${path} has ${headings.length} h1 elements`);

    if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(page.body)) {
      fail(`${path} is marked noindex`);
    }

    if (!/property="og:title"/.test(page.body)) fail(`${path} has no Open Graph title`);
    if (!/property="og:image"/.test(page.body)) fail(`${path} has no Open Graph image`);
  }

  // Structured data has to parse. Invalid JSON-LD is ignored silently by every
  // consumer, which is the worst failure mode: it looks present and does
  // nothing.
  if (published) {
    const home = await get("/");
    const blocks = [
      ...home.body.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    ];
    if (blocks.length === 0) fail("/ carries no structured data");
    for (const [, block] of blocks) {
      try {
        const parsed = JSON.parse(block);
        if (!parsed["@context"]) fail("a structured data block has no @context");
      } catch {
        fail("a structured data block is not valid JSON");
      }
    }
    notes.push(`${blocks.length} structured data block(s) on /`);
  }

  // A page that does not exist has to say so, or every typo becomes an
  // indexable duplicate of the home page.
  const missing = await get("/a-page-that-does-not-exist");
  if (missing.status !== 404) fail(`an unknown address returned ${missing.status}, not 404`);

  for (const note of notes) console.log(`  ${note}`);

  if (failures.length) {
    console.error(`\n  ${failures.length} search readiness problem(s):`);
    for (const message of failures) console.error(`    - ${message}`);
    process.exit(1);
  }

  console.log("\n  Search readiness checks passed.");
}

main().catch((error) => {
  console.error(`  Could not complete the check: ${error.message}`);
  process.exit(1);
});
