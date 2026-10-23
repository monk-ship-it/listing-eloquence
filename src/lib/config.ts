import logo72 from "@/assets/quill-logo-72.webp";
import logo144 from "@/assets/quill-logo-144.webp";

export const APP_NAME = "Quill";
export const APP_TAGLINE = "AI listing copy for UK estate agents";
/** Small WebP exports of the brand mark (1x/2x for the ~36px header logo). */
export const LOGO_URL = logo72;
export const LOGO_SRCSET = `${logo72} 1x, ${logo144} 2x`;

export const TRIAL_DAYS = 14;
export const CONTACT_EMAIL = "domenico@copybymonk.com";

export type PlanId = "starter" | "pro" | "growth";

// ---------------------------------------------------------------------------
// Market & currency — Quill is UK-only (GBP).
// ---------------------------------------------------------------------------
export type MarketId = "uk";
export type CurrencyId = "gbp";

export interface Market {
  id: MarketId;
  currency: CurrencyId;
  label: string;
  shortLabel: string;
  symbol: string;
  audience: string;
}

export const MARKETS: Record<MarketId, Market> = {
  uk: {
    id: "uk",
    currency: "gbp",
    label: "UK estate agents · GBP",
    shortLabel: "UK · GBP",
    symbol: "£",
    audience: "estate agents",
  },
};

export const DEFAULT_MARKET: MarketId = "uk";

export function getMarket(_market?: string | null): Market {
  return MARKETS.uk;
}

/** Always "uk". Tolerates legacy values (e.g. "us") stored on old rows. */
export function resolveMarketId(_market?: string | null): MarketId {
  return "uk";
}

/**
 * Authoritative Stripe identifiers per plan (GBP, monthly). Amounts in pence.
 * Public identifiers — safe in the client bundle. The client never provides a
 * price id; it is resolved server-side from the plan.
 *
 * All purchases use authenticated server-created Checkout Sessions.
 * Quill is not VAT registered; no VAT is added to these prices.
 */
export const PLAN_PRICING: Record<
  PlanId,
  {
    amount: number;
    priceId: string;
  }
> = {
  starter: {
    amount: 1500,
    priceId: "price_1UTNwcAAj6LfwOUaEERDFxWz",
  },
  pro: {
    amount: 2900,
    priceId: "price_1UTNxlAAj6LfwOUayyPzL1Wn",
  },
  growth: {
    amount: 5900,
    priceId: "price_1UTNzHAAj6LfwOUaZvoCC1oS",
  },
};

/** Display price string for a new subscription. Existing prices are preserved. */
export function planPriceDisplay(plan: PlanId): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format((PLAN_PRICING[plan] ?? PLAN_PRICING.starter).amount / 100);
}

/** Authoritative Stripe price id for a plan (server-side resolution). */
export function resolvePlanPriceId(plan: PlanId): string {
  return (PLAN_PRICING[plan] ?? PLAN_PRICING.starter).priceId;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  /** Listings allowed per calendar month. */
  monthlyListings: number;
  tagline: string;
  features: string[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: planPriceDisplay("starter"),
    monthlyListings: 15,
    tagline: "For solo agents getting started.",
    features: [
      "15 listing packs per calendar month",
      "All five brand voices",
      "Generated Key Features bullets",
      "Email Blast campaign copy",
      "Social captions with hashtags",
      "Saved listing history",
      "Dedicated voice notes field",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: planPriceDisplay("pro"),
    monthlyListings: 50,
    tagline: "For busy agents writing regularly.",
    features: [
      "50 listing packs per calendar month",
      "All five brand voices",
      "Generated Key Features bullets",
      "Email Blast campaign copy",
      "Social captions with hashtags",
      "Saved listing history",
      "Dedicated voice notes field",
    ],
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: planPriceDisplay("growth"),
    monthlyListings: 120,
    tagline: "For high-volume agents.",
    features: [
      "120 listing packs per calendar month",
      "All five brand voices",
      "Generated Key Features bullets",
      "Email Blast campaign copy",
      "Social captions with hashtags",
      "Saved listing history",
      "Dedicated voice notes field",
    ],
  },
];

export const PLAN_MAP: Record<PlanId, Plan> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<PlanId, Plan>,
);

export function getPlan(plan: string | null | undefined): Plan {
  return PLAN_MAP[(plan as PlanId) ?? "starter"] ?? PLAN_MAP.starter;
}

/** Default/headline price shown on marketing pages. */
export const PRICE_MONTHLY = PLAN_MAP.starter.price;
