#!/usr/bin/env node
/**
 * Fail if any D1 query shape is reading far more rows than it returns.
 *
 * D1 bills rows_read, and that is what made the Cloudflare bill: three queries
 * on the icon page were each scanning a whole icon set -- 16,347 rows to return
 * 4 -- for a month before anyone noticed, because nothing watched the number.
 * A query that loses its index looks fine in every other signal: same results,
 * single-digit milliseconds, no errors. Only rows_read moves.
 *
 *   node scripts/d1-cost-check.mjs            # last 24h
 *   node scripts/d1-cost-check.mjs --hours 6
 *   node scripts/d1-cost-check.mjs --budget 500
 */
import { execFileSync } from "node:child_process";

const ACCOUNT = "dbc43b99850cce79e60068b29c489278";
const DATABASE = "b23a013e-9752-4064-8c4f-f5e20c89985f"; // icons-db
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const hours = arg("hours", 24);
// The failure mode this catches is a query losing its index and scanning a whole
// icon set, which measured 7,200-16,300 rows per call. Measured in production
// after the fix, the two related-icons queries average 614 and 1,077 -- a spot
// check on one narrow family had suggested 71, so the threshold is set from the
// fleet average, not from a single icon. 2,000 sits clear of both and well under
// a full scan.
const budget = arg("budget", 2000);
// listIconNames legitimately pages whole sets, 5,000 rows at a time, to build
// the per-set sitemaps.
const EXEMPT = [/^SELECT name FROM icons WHERE prefix = \?1 AND name > \?2/];
const MIN_CALLS = 1000; // ignore long-tail shapes that cannot move the bill

const sql = `
SELECT query,
       SUM(rowsRead * sampleInterval) / SUM(sampleInterval) AS rows_per_query,
       SUM(rowsRead * sampleInterval) AS rows_read,
       SUM(sampleInterval) AS calls
FROM events.d1Queries
WHERE accountTag = '${ACCOUNT}' AND databaseId = '${DATABASE}'
  AND timestamp >= now() - INTERVAL ${Math.round(hours * 60)} MINUTE
GROUP BY query ORDER BY rows_read DESC LIMIT 40`;

const { data } = JSON.parse(execFileSync("cf", ["analytics", "sql", "get", "--query", sql], { encoding: "utf8", maxBuffer: 1 << 28 }));

const total = data.reduce((n, r) => n + r.rows_read, 0);
console.log(`icons-db, last ${hours}h: ${(total / 1e9).toFixed(2)}B rows read\n`);

const over = data.filter(
  (r) => r.calls >= MIN_CALLS && r.rows_per_query > budget && !EXEMPT.some((re) => re.test(r.query)),
);
for (const r of data.slice(0, 8)) {
  const flag = over.includes(r) ? "FAIL" : "ok  ";
  console.log(`${flag} ${String(Math.round(r.rows_per_query)).padStart(7)} rows/call  ${String(Math.round(r.calls)).padStart(9)} calls  ${r.query.slice(0, 80)}`);
}

if (over.length) {
  console.error(`\n${over.length} query shape(s) over ${budget} rows/call -- something lost its index.`);
  process.exit(1);
}
console.log(`\nNo query shape over ${budget} rows/call.`);
