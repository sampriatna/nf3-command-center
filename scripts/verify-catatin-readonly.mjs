import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync("src/app/api/finance/catatin/route.ts", "utf8");
const page = readFileSync("src/app/finance/catatin/page.tsx", "utf8");
const finance = readFileSync("src/app/finance/page.tsx", "utf8");

assert.match(api, /export async function GET\(/, "Catatin endpoint must be GET-only");
assert.doesNotMatch(api, /export async function (?:POST|PUT|PATCH|DELETE)\(/, "No mutating handlers allowed");
assert.match(api, /BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/, "DB read-only transaction required");
assert.match(api, /FROM public\.app_transactions/, "Queries must read the Catatin source");
assert.doesNotMatch(api, /(?:\bINSERT\s+INTO\b|\bUPDATE\s+public\.|\bDELETE\s+FROM\b|\bTRUNCATE\s+TABLE\b|\bDROP\s+TABLE\b)/i, "No modifying SQL allowed");
assert.doesNotMatch(api, /service_role|BYPASSRLS/i, "No bypassing permissions");
assert.match(api, /NF3_FINANCE_OWNER_EMAILS/, "Server-side owner allowlist required");
assert.match(api, /CATATIN_READONLY_DATABASE_URL/, "Dedicated database credentials required");
assert.doesNotMatch(page, /CATATIN_READONLY_DATABASE_URL/, "DB credentials cannot appear in a client component");
assert.match(finance, /href="\/finance\/catatin"/, "Finance should link to separate read-only page");

console.log("Catatin integration static read-only safety checks passed.");
