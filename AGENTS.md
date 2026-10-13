
- Public-page SEO (social cards, Organization/WebSite schema, en-GB locale) comes from src/lib/seo.ts; responsive photo variants from src/lib/images.ts — keeps metadata and image sizing consistent across routes.
- Single market (UK, GBP): pricing lives in PLAN_PRICING in src/lib/config.ts; retired price ids map via LEGACY_PRICE_PLAN in config.server.ts — old subscriber rows must keep resolving to a plan.
