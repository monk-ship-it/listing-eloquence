
- Public-page SEO (social cards, Organization/WebSite schema, en-GB locale) comes from src/lib/seo.ts; responsive photo variants from src/lib/images.ts — keeps metadata and image sizing consistent across routes.
- Single market (UK, GBP): pricing lives in PLAN_PRICING in src/lib/config.ts; retired price ids map via LEGACY_PRICE_PLAN in config.server.ts — old subscriber rows must keep resolving to a plan.
- Listing packs are two parallel Claude tool-use calls (core + marketing) in listing.functions.ts; only core success consumes a credit, so a marketing failure never costs the agent their listing.
- The generator form renders from FIELD_DEFS in src/lib/listing-fields.ts (labels, dictation mode, extraction eligibility); add new fields there so they get a mic and "Fill the form" support automatically.
- Material Information and the fact check are deterministic (src/lib/material-info.ts, src/lib/fact-check.ts) — never AI — so compliance guidance is predictable and unit-tested.
