#!/usr/bin/env node
/**
 * Enforce a budget on the JavaScript a visitor downloads.
 *
 * A budget only works if it fails a build. Measuring a bundle and writing the
 * number in a document produces a number nobody reads and a bundle that grows
 * anyway.
 *
 * The figures are uncompressed bytes of the built chunks. Transfer will be
 * smaller, but uncompressed size is what the browser parses and executes, and
 * parse time is the part that hurts on a phone.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/** Total shipped JavaScript, uncompressed, across every chunk. */
const TOTAL_BUDGET_KB = 1200;

/** The largest any single chunk may be. A big one is usually an accident. */
const CHUNK_BUDGET_KB = 400;

const CHUNKS = ".next/static/chunks";

function walk(directory) {
  const found = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      found.push(...walk(path));
    } else if (entry.endsWith(".js")) {
      found.push(path);
    }
  }
  return found;
}

let files;
try {
  files = walk(CHUNKS);
} catch {
  console.error(`No build output at ${CHUNKS}. Run the build first.`);
  process.exit(1);
}

const measured = files
  .map((path) => {
    const source = readFileSync(path);
    return { path, bytes: source.length, gzipped: gzipSync(source).length };
  })
  .sort((a, b) => b.bytes - a.bytes);

const total = measured.reduce((sum, file) => sum + file.bytes, 0);
const totalGzipped = measured.reduce((sum, file) => sum + file.gzipped, 0);

const kb = (bytes) => (bytes / 1024).toFixed(0);

console.log(`JavaScript: ${kb(total)} kB across ${measured.length} chunks`);
console.log(`Transferred, gzipped: about ${kb(totalGzipped)} kB`);
console.log("\nLargest chunks:");
for (const file of measured.slice(0, 5)) {
  console.log(`  ${kb(file.bytes).padStart(5)} kB  ${file.path.replace(`${CHUNKS}/`, "")}`);
}

const failures = [];

if (total / 1024 > TOTAL_BUDGET_KB) {
  failures.push(`Total is ${kb(total)} kB, over the ${TOTAL_BUDGET_KB} kB budget.`);
}

for (const file of measured) {
  if (file.bytes / 1024 > CHUNK_BUDGET_KB) {
    failures.push(
      `${file.path} is ${kb(file.bytes)} kB, over the ${CHUNK_BUDGET_KB} kB per chunk budget.`,
    );
  }
}

if (failures.length) {
  console.error("\nBundle budget exceeded:");
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nEither remove weight or raise the budget deliberately, with a reason.");
  process.exit(1);
}

console.log("\nWithin budget.");
