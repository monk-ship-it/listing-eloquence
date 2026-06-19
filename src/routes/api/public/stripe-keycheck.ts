import { createFileRoute } from "@tanstack/react-router";

// TEMPORARY diagnostic endpoint — verifies the configured Stripe secret key
// is valid by calling a harmless read-only Stripe endpoint. Returns only the
// key prefix and outcome; never the key itself. Remove after verification.
export const Route = createFileRoute("/api/public/stripe-keycheck")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.STRIPE_SECRET_KEY ?? "";
        const prefix = key.slice(0, 8);
        if (!key) {
          return Response.json({ ok: false, prefix, error: "missing key" });
        }
        try {
          const res = await fetch("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Bearer ${key}` },
          });
          const data = (await res.json()) as { error?: { message?: string } };
          return Response.json({
            ok: res.ok,
            prefix,
            status: res.status,
            error: data?.error?.message ?? null,
          });
        } catch (err) {
          return Response.json({
            ok: false,
            prefix,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    },
  },
});
