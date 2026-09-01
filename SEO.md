# Search visibility

What this site does about being found, and where each piece lives. Written
against the playbook in `documentation/`, and kept here because the
implementation is what a reader has to trust rather than the intention.

## The one setting that matters most

`NEXT_PUBLIC_SITE_ORIGIN`. Every absolute URL the site emits is built from it:
canonical tags, Open Graph, the sitemap, robots, and every structured data
identifier. Pointed at the wrong host, the site tells search engines to index
the wrong host, and does it consistently enough to be believed.

## Crawling

`src/app/robots.ts` is generated per request, not at build time, because
whether the site should be crawled at all depends on whether it is published,
and that changes from the console. Unpublished, it refuses everything: a
crawler that arrives early is told to come back rather than left to form an
opinion about a domain of empty pages.

Published, it allows everything except `/admin`, `/api/`, `/ask`, and
`/offline`. The conversational surface is excluded because crawling it would
cost a model call per request and produce nothing indexable.

## The sitemap

`src/app/sitemap.ts`, also per request, and built from what is actually
published rather than from a list. Project pages are the reason it exists: a
sitemap that lists the navigation but not the work is doing half the job.

`lastModified` is when a project was published, not when the file was
generated. A timestamp that always says "just now" teaches a crawler to ignore
the field.

`/ask` is deliberately absent, because robots disallows it, and listing a
disallowed address is a contradiction search engines report as one.

## Per page

Every indexable page carries a unique title, a description, a canonical URL,
one `h1`, and Open Graph tags including an image. `/` and `/projects/[slug]`
generate their own social images at request time from the record they describe.

## Structured data

In `src/components/StructuredData.tsx`, serialised from records the site
already serves, so it cannot claim something the visible page does not. That
matters more than it sounds: structured data disagreeing with the page is what
search engines penalise.

| Page | Types |
| :-- | :-- |
| `/` | `Person`, `WebSite` |
| `/projects` | `ItemList`, `BreadcrumbList` |
| `/projects/[slug]` | `CreativeWork`, `BreadcrumbList` |
| `/about` | `ProfilePage`, `Person` with `knowsAbout`, `BreadcrumbList` |

The `Person` node has one `@id` across every page, so a search engine reads
them as one entity rather than four descriptions of different people.

## Answer engines

The case studies are written to be retrievable a section at a time: why it
exists, how it is built, what was built, the hard part, the outcome. A system
retrieving one of those gets a complete answer rather than a fragment that
depends on the paragraph above it. Each skill links to the work that
demonstrates it, so a claim of competence arrives with its evidence.

## Telling search engines about changes

Most projects do this from continuous integration, because most projects change
when someone pushes. This one changes when the owner approves something in the
console, which a build never sees. So the notification lives where the change
happens: publishing or blocking a project queues `seo.indexnow`, which submits
the published addresses.

The key is served at `/<key>.txt` by the middleware, from an environment value
rather than a file in `public/`, so it never enters the repository.

Unconfigured, none of this runs and nothing fails.

## Checking it

```bash
npm run build
npm run start &
npm run check:seo -- https://0xsemantic.com
```

`scripts/check-seo.mjs` reads what the site actually serves and fails on: a
missing or empty sitemap, duplicate or malformed sitemap URLs, a disallowed
address listed in the sitemap, a page missing a title, description, canonical,
or `h1`, more than one `h1`, an accidental `noindex`, a canonical on the wrong
host, missing Open Graph tags, structured data that does not parse, and an
unknown address that does not return 404.

A build time check would pass on a site whose content comes from a database,
which this one's does.

## What still needs a person

Verifying the domain in Google Search Console and Bing Webmaster Tools, and
submitting the sitemap once. Set the meta tag values as
`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`
and they are rendered; leave them empty and no tag is emitted at all.
