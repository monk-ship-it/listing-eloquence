import logoAsset from "@/assets/quill-logo.png.asset.json";

export const APP_NAME = "Quill";
export const APP_TAGLINE = "AI listing copy for UK estate agents";
export const LOGO_URL = logoAsset.url;

export const TRIAL_DAYS = 14;
export const CONTACT_EMAIL = "domenico@copybymonk.com";

export type PlanId = "starter" | "pro" | "growth";

// ---------------------------------------------------------------------------
// Markets & currencies
// ---------------------------------------------------------------------------
export type MarketId = "uk" | "us";
export type CurrencyId = "gbp" | "usd";

export interface Market {
  id: MarketId;
  currency: CurrencyId;
  /** Long selector label, e.g. "UK estate agents · GBP". */
  label: string;
  /** Compact label, e.g. "UK · GBP". */
  shortLabel: string;
  /** Currency symbol. */
  symbol: string;
  /** Audience noun, e.g. "estate agents" / "real estate agents". */
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
  us: {
    id: "us",
    currency: "usd",
    label: "US real estate agents · USD",
    shortLabel: "US · USD",
    symbol: "$",
    audience: "real estate agents",
  },
};

export const DEFAULT_MARKET: MarketId = "uk";

export function getMarket(market: string | null | undefined): Market {
  return MARKETS[(market as MarketId) ?? DEFAULT_MARKET] ?? MARKETS[DEFAULT_MARKET];
}

/** Narrow an untrusted value to a valid MarketId, defaulting to UK. */
export function resolveMarketId(market: string | null | undefined): MarketId {
  return market === "us" ? "us" : "uk";
}

/**
 * Authoritative, hard-coded Stripe price identifiers per market and plan.
 * Amounts are in the currency's minor unit (pence / cents). These are the
 * single source of truth used server-side to resolve the correct price id —
 * the client never provides a price id.
 */
export const PLAN_PRICING: Record<
  MarketId,
  Record<PlanId, { amount: number; priceId: string; display: string }>
> = {
  uk: {
    starter: { amount: 3900, priceId: "price_1TqWz1AAj6LfwOUatt9zzYA1", display: "£39" },
    pro: { amount: 7900, priceId: "price_1TqWz2AAj6LfwOUaQBZwZyJr", display: "£79" },
    growth: { amount: 14900, priceId: "price_1TqWz3AAj6LfwOUat924mxdX", display: "£149" },
  },
  us: {
    starter: { amount: 4900, priceId: "price_1Tst7KAAj6LfwOUap6nwwkT1", display: "$49" },
    pro: { amount: 9900, priceId: "price_1Tst7TAAj6LfwOUaTOG299iy", display: "$99" },
    growth: { amount: 19900, priceId: "price_1Tst7dAAj6LfwOUaD8AqhUVE", display: "$199" },
  },
};

/** Display price string (e.g. "£39" / "$49") for a plan in a given market. */
export function planPriceDisplay(plan: PlanId, market: MarketId): string {
  return PLAN_PRICING[market]?.[plan]?.display ?? PLAN_PRICING.uk[plan].display;
}

/** Authoritative Stripe price id for a plan + market (server-side resolution). */
export function resolvePlanPriceId(plan: PlanId, market: MarketId): string {
  return PLAN_PRICING[market]?.[plan]?.priceId ?? PLAN_PRICING.uk[plan].priceId;
}

/**
 * Live Stripe identifiers for the current pricing (GBP, monthly).
 * These are public identifiers (safe in the client bundle) and act as the
 * authoritative source of truth for checkout, used ahead of any env secrets.
 * Amounts are in pence.
 *
 * NOTE: The old payment links (£24.99/£29.99/£49.99) are intentionally
 * inactive in Stripe; authenticated checkouts use server-created sessions
 * with the prices below.
 */
export const STRIPE_PLAN_IDS: Record<
  PlanId,
  { amount: number; priceId: string; paymentLinkId: string; paymentLinkUrl: string }
> = {
  starter: {
    amount: 3900,
    priceId: "price_1TqWz1AAj6LfwOUatt9zzYA1",
    paymentLinkId: "plink_1TqWzwAAj6LfwOUacoHflGaU",
    paymentLinkUrl: "https://buy.stripe.com/5kQ3cugxncRgbRIbN87AI0F",
  },
  pro: {
    amount: 7900,
    priceId: "price_1TqWz2AAj6LfwOUaQBZwZyJr",
    paymentLinkId: "plink_1TqWzxAAj6LfwOUabZDgo7y9",
    paymentLinkUrl: "https://buy.stripe.com/bJe7sK0yp8B02h818u7AI0G",
  },
  growth: {
    amount: 14900,
    priceId: "price_1TqWz3AAj6LfwOUat924mxdX",
    paymentLinkId: "plink_1TqWzyAAj6LfwOUaWFwYhXOc",
    paymentLinkUrl: "https://buy.stripe.com/14A3cu5SJbNc9JAg3o7AI0H",
  },
};

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  /** Listings allowed per calendar month. */
  monthlyListings: number;
  tagline: string;
  features: string[];
  /** Stripe payment link — to be filled in per plan. */
  stripeLink: string;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "£39",
    monthlyListings: 15,
    tagline: "For solo agents getting started.",
    features: [
      "15 listings per month",
      "All four brand voices",
      "Social captions with hashtags",
      "Saved listing history",
      "Dedicated voice notes field",
    ],
    stripeLink: STRIPE_PLAN_IDS.starter.paymentLinkUrl,
  },
  {
    id: "pro",
    name: "Pro",
    price: "£79",
    monthlyListings: 50,
    tagline: "For busy agents and small teams.",
    features: [
      "50 listings per month",
      "All four brand voices",
      "Social captions with hashtags",
      "Saved listing history",
      "Priority generation",
      "Dedicated voice notes field",
    ],
    stripeLink: STRIPE_PLAN_IDS.pro.paymentLinkUrl,
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "£149",
    monthlyListings: 120,
    tagline: "For high-volume agencies.",
    features: [
      "120 listings per month",
      "All four brand voices",
      "Social captions with hashtags",
      "Saved listing history",
      "Priority generation",
      "Dedicated voice notes field",
    ],
    stripeLink: STRIPE_PLAN_IDS.growth.paymentLinkUrl,
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

export const STRIPE_PAYMENT_LINK = PLAN_MAP.starter.stripeLink;

/** Emails granted free, permanent access to the app (case-insensitive). */
export const COMPED_EMAILS = ["domenico@copybymonk.com"];

/** Whether the given email always has full access, bypassing billing. */
export function isCompedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return COMPED_EMAILS.includes(email.trim().toLowerCase());
}

/** Build a payment-link URL pre-filled with the user's email and reference. */
export function buildCheckoutUrl(userId: string, email: string, plan: PlanId = "starter"): string {
  const link = PLAN_MAP[plan]?.stripeLink || STRIPE_PAYMENT_LINK;
  const url = new URL(link);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}
