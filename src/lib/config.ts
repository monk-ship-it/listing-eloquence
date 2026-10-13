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
 * NOTE: The old payment links (£24.99/£29.99/£49.99) are intentionally
 * inactive in Stripe; authenticated checkouts use server-created sessions.
 */
export const PLAN_PRICING: Record<
  PlanId,
  {
    amount: number;
    priceId: string;
    display: string;
    paymentLinkId: string;
    paymentLinkUrl: string;
  }
> = {
  starter: {
    amount: 3900,
    priceId: "price_1TqWz1AAj6LfwOUatt9zzYA1",
    display: "£39",
    paymentLinkId: "plink_1TqWzwAAj6LfwOUacoHflGaU",
    paymentLinkUrl: "https://buy.stripe.com/5kQ3cugxncRgbRIbN87AI0F",
  },
  pro: {
    amount: 7900,
    priceId: "price_1TqWz2AAj6LfwOUaQBZwZyJr",
    display: "£79",
    paymentLinkId: "plink_1TqWzxAAj6LfwOUabZDgo7y9",
    paymentLinkUrl: "https://buy.stripe.com/bJe7sK0yp8B02h818u7AI0G",
  },
  growth: {
    amount: 14900,
    priceId: "price_1TqWz3AAj6LfwOUat924mxdX",
    display: "£149",
    paymentLinkId: "plink_1TqWzyAAj6LfwOUaWFwYhXOc",
    paymentLinkUrl: "https://buy.stripe.com/14A3cu5SJbNc9JAg3o7AI0H",
  },
};

/** Display price string (e.g. "£39") for a plan. */
export function planPriceDisplay(plan: PlanId): string {
  return (PLAN_PRICING[plan] ?? PLAN_PRICING.starter).display;
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
      "Generated Key Features bullets",
      "Email Blast campaign copy",
      "Social captions with hashtags",
      "Saved listing history",
      "Dedicated voice notes field",
    ],
    stripeLink: PLAN_PRICING.starter.paymentLinkUrl,
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
      "Generated Key Features bullets",
      "Email Blast campaign copy",
      "Social captions with hashtags",
      "Saved listing history",
      "Priority generation",
      "Dedicated voice notes field",
    ],
    stripeLink: PLAN_PRICING.pro.paymentLinkUrl,
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
      "Generated Key Features bullets",
      "Email Blast campaign copy",
      "Social captions with hashtags",
      "Saved listing history",
      "Priority generation",
      "Dedicated voice notes field",
    ],
    stripeLink: PLAN_PRICING.growth.paymentLinkUrl,
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

/** Build a payment-link URL pre-filled with the user's email and reference. */
export function buildCheckoutUrl(userId: string, email: string, plan: PlanId = "starter"): string {
  const link = PLAN_MAP[plan]?.stripeLink || STRIPE_PAYMENT_LINK;
  const url = new URL(link);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}
