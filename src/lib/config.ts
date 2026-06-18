import logoAsset from "@/assets/quill-logo.png.asset.json";

export const APP_NAME = "Quill";
export const APP_TAGLINE = "AI listing copy for UK estate agents";
export const LOGO_URL = logoAsset.url;

export const TRIAL_DAYS = 14;
export const CONTACT_EMAIL = "domenico@copybymonk.com";

export type PlanId = "starter" | "pro" | "growth";

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
    price: "£24.99",
    monthlyListings: 15,
    tagline: "For solo agents getting started.",
    features: [
      "15 listings per month",
      "All four brand voices",
      "Social captions with hashtags",
      "Saved listing history",
    ],
    // Existing live link — Starter
    stripeLink: "https://buy.stripe.com/3cI00i1Ct5oO4pg3gC7AI0C",
  },
  {
    id: "pro",
    name: "Pro",
    price: "£29.99",
    monthlyListings: 30,
    tagline: "For busy agents and small teams.",
    features: [
      "30 listings per month",
      "All four brand voices",
      "Social captions with hashtags",
      "Saved listing history",
      "Priority generation",
    ],
    stripeLink: "",
    popular: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "£49.99",
    monthlyListings: 50,
    tagline: "For high-volume agencies.",
    features: [
      "50 listings per month",
      "All four brand voices",
      "Social captions with hashtags",
      "Saved listing history",
      "Priority generation",
    ],
    stripeLink: "",
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
