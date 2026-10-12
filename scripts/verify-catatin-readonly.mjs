import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync("src/app/api/finance/catatin/route.ts", "utf8");
const page = readFileSync("src/app/finance/catatin/page.tsx", "utf8");
const finance = readFileSync("src/app/finance/page.tsx", "utf8");
const sidebar = readFileSync("src/components/layout/Sidebar.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(api, /export async function GET\(/, "Catatin endpoint must be GET-only");
assert.doesNotMatch(api, /export async function (?:POST|PUT|PATCH|DELETE)\(/, "No mutation handlers allowed");
assert.doesNotMatch(api, /\b(new Client|createClient)\s*\(|\bfrom\s+"pg"|fetch\(.*catatin/gi, "No direct Catatin DB/network access allowed");
assert.doesNotMatch(api, /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|UPSERT)\b\s+(INTO|FROM|TABLE)?/gi, "No write SQL allowed");
assert.match(api, /CATATIN_FINANCE_SNAPSHOT_JSON/, "Server-only environment snapshot required");
assert.match(api, /NF3_FINANCE_OWNER_EMAILS/, "Owner allowlist required");
assert.match(api, /auth\.auth\.getUser\(/, "Verify Supabase user server-side");
assert.match(api, /user\.email_confirmed_at/, "Owner email must be verified");
assert.match(api, /"SNAPSHOT_NOT_CONFIGURED"/, "No false Rp0 totals when data missing");
assert.match(api, /"Cache-Control": "private, no-store/, "Sensitive response must be uncached");
assert.doesNotMatch(page, /CATATIN_FINANCE_SNAPSHOT_JSON/, "Snapshot must not ship to browser");
assert.match(finance, /href="\/finance\/catatin"/, "Finance must link to owner report");
assert.match(sidebar, /mobileOpen/, "Mobile sidebar must be collapsible");
assert.match(css, /max-width: 1023px/, "Mobile layout needs a viewport breakpoint");
assert.ok(!pkg.dependencies?.pg && !pkg.devDependencies?.["@types/pg"], "Server-only Postgres dependency should be removed");

console.log("Catatin snapshot security and mobile guard checks passed.");
