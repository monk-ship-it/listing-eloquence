import logoAsset from "@/assets/quill-logo.png.asset.json";

export const APP_NAME = "Quill";
export const APP_TAGLINE = "AI listing copy for UK estate agents";
export const LOGO_URL = logoAsset.url;

export const PRICE_MONTHLY = "£24.99";
export const TRIAL_DAYS = 14;
export const CONTACT_EMAIL = "domenico@copybymonk.com";

export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/3cI00i1Ct5oO4pg3gC7AI0C";

/** Build a payment-link URL pre-filled with the user's email and reference. */
export function buildCheckoutUrl(userId: string, email: string): string {
  const url = new URL(STRIPE_PAYMENT_LINK);
  url.searchParams.set("client_reference_id", userId);
  if (email) url.searchParams.set("prefilled_email", email);
  return url.toString();
}
