import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-keycheck")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.STRIPE_SECRET_KEY || "";
        try {
          const res = await fetch("https://api.stripe.com/v1/prices?limit=1", {
            headers: { Authorization: `Bearer ${key}` },
          });
          const data = await res.json();
          return Response.json({
            ok: res.ok,
            status: res.status,
            keyPrefix: key.slice(0, 8),
            keyLength: key.length,
            error: data?.error?.message ?? null,
          });
        } catch (e: any) {
          return Response.json({ ok: false, error: String(e) });
        }
      },
    },
  },
});
