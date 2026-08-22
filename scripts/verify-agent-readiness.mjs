#!/usr/bin/env node
// Verifies the agent-readiness behaviors: agent-friendly 404s, markdown content
// negotiation (Vary: Accept), JSON-LD, trust pages, and machine-readable files.
//
//   node scripts/verify-agent-readiness.mjs [baseUrl]
//   npm run test:agent                       # defaults to http://localhost:3000
//   npm run test:agent -- https://thepickempool.com

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function get(path, headers = {}) {
  const res = await fetch(`${base}${path}`, { headers, redirect: "manual" });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

const MD = { accept: "text/markdown" };
const HTML = { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" };

console.log(`Agent readiness checks against ${base}\n`);

// 1. Agent-friendly 404s
{
  const r = await get("/some-path-that-does-not-exist-xyz", HTML);
  check("unknown path returns HTTP 404", r.status === 404, `got ${r.status}`);
  check(
    "404 body points at sitemap and llms.txt",
    r.body.includes("/sitemap.xml") && r.body.includes("/llms.txt"),
  );
  const rmd = await get("/some-path-that-does-not-exist-xyz.md", MD);
  check("unknown .md path returns markdown 404", rmd.status === 404 && (rmd.headers.get("content-type") ?? "").includes("text/markdown"), `got ${rmd.status} ${rmd.headers.get("content-type")}`);
  check("markdown 404 body links llms.txt", rmd.body.includes("llms.txt"));
}

// 2. Markdown content negotiation
{
  const r = await get("/", MD);
  const ct = r.headers.get("content-type") ?? "";
  const vary = r.headers.get("vary") ?? "";
  check("Accept: text/markdown on / returns text/markdown", ct.includes("text/markdown"), `got ${ct}`);
  check("markdown response Vary includes Accept", /(^|,\s*)accept($|,)/i.test(vary), `got "${vary}"`);
  check("markdown body is markdown", r.body.trimStart().startsWith("#"));

  const rh = await get("/", HTML);
  const hct = rh.headers.get("content-type") ?? "";
  const hvary = rh.headers.get("vary") ?? "";
  check("browser Accept on / still returns HTML", hct.includes("text/html"), `got ${hct}`);
  // Next.js overwrites Vary on HTML page renders; on production the header is
  // added at the Vercel edge (vercel.json), so only enforce it off-localhost.
  if (/(^|[,\s])accept($|,)/i.test(hvary)) {
    check("HTML response Vary includes Accept", true);
  } else if (base.includes("localhost")) {
    console.log(`  - HTML Vary lacks Accept locally (added by Vercel edge in prod) — got "${hvary}"`);
  } else {
    check("HTML response Vary includes Accept", false, `got "${hvary}"`);
  }

  for (const p of ["/formats", "/support", "/privacy", "/about", "/docs", "/blog"]) {
    const rp = await get(p, MD);
    check(`${p} negotiates markdown`, rp.status === 200 && (rp.headers.get("content-type") ?? "").includes("text/markdown"), `got ${rp.status} ${rp.headers.get("content-type")}`);
  }
  const rmd = await get("/formats.md", HTML);
  check("/formats.md serves markdown regardless of Accept", rmd.status === 200 && (rmd.headers.get("content-type") ?? "").includes("text/markdown"), `got ${rmd.status} ${rmd.headers.get("content-type")}`);
  const rblog = await get("/blog/how-nfl-confidence-pool-works.md", HTML);
  check("blog post .md serves markdown", rblog.status === 200 && rblog.body.trimStart().startsWith("#"), `got ${rblog.status}`);
}

// 3–5. Developer resources, JSON-LD, agent instructions
{
  const home = await get("/", HTML);
  check("homepage has JSON-LD", home.body.includes("application/ld+json"));
  check("JSON-LD has Organization + contactPoint", home.body.includes('"Organization"') && home.body.includes("contactPoint"));
  check("JSON-LD has SoftwareApplication with offers", home.body.includes('"SoftwareApplication"') && home.body.includes('"offers"'));

  const docs = await get("/docs", HTML);
  check("/docs exists and names the product", docs.status === 200 && docs.body.includes("thepickempool Developer"), `got ${docs.status}`);

  const llms = await get("/llms.txt", HTML);
  check("llms.txt has when-to-use guidance", llms.status === 200 && llms.body.includes("When To Use thepickempool"), `got ${llms.status}`);
  check("llms.txt lists developer resources", llms.body.includes("/docs") && llms.body.includes("sitemap.xml"));
}

// 7. Trust anchor pages
{
  for (const p of ["/about", "/support", "/privacy"]) {
    const r = await get(p, HTML);
    const textLength = r.body.replace(/<[^>]+>/g, "").length;
    check(`${p} returns 200 with substantial content`, r.status === 200 && textLength > 500, `got ${r.status}, ~${textLength} chars`);
  }
}

// Machine-readable files
{
  const sm = await get("/sitemap.xml", HTML);
  check("sitemap.xml lists /about and /docs", sm.status === 200 && sm.body.includes("/about") && sm.body.includes("/docs"), `got ${sm.status}`);
  const rb = await get("/robots.txt", HTML);
  check("robots.txt allows /about and /docs", rb.status === 200 && rb.body.includes("/about") && rb.body.includes("/docs"), `got ${rb.status}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
