/**
 * Opinly content webhook (Svix-signed) — invalidates cached content routes.
 * Registered in the Opinly dashboard as: https://copybymonk.com/api/public/opinly-webhook
 */
import { createFileRoute } from "@tanstack/react-router";

interface InvalidationPayload {
  type?: string;
  data?: { paths?: string[] };
}

export const Route = createFileRoute("/api/public/opinly-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["SVIX_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("SVIX_WEBHOOK_SECRET is not configured");
          return new Response("Webhook not configured", { status: 500 });
        }

        const rawBody = await request.text();
        const headers = {
          "svix-id": request.headers.get("svix-id") ?? "",
          "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
          "svix-signature": request.headers.get("svix-signature") ?? "",
        };

        let payload: InvalidationPayload;
        try {
          const { Webhook } = await import("svix");
          payload = new Webhook(secret).verify(rawBody, headers) as InvalidationPayload;
        } catch (err) {
          console.error("Invalid Opinly webhook signature", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const paths = Array.isArray(payload.data?.paths) ? payload.data.paths : [];
        const { invalidateOpinlyCache, clearOpinlyCache } = await import("@/lib/opinly/api.server");

        if (paths.length === 0) {
          clearOpinlyCache();
        } else {
          const prefixes = new Set<string>();
          for (const path of paths) {
            if (path === "/blog" || path === "/") prefixes.add("/content/posts");
            else if (path === "/sitemap" || path === "/sitemap.xml")
              prefixes.add("/content/routes");
            else if (path.startsWith("/blog/")) {
              // A single post changed: drop its detail cache plus every listing.
              prefixes.add("/content/post?");
              prefixes.add("/content/posts");
              prefixes.add("/content/routes");
              prefixes.add("/content/rss");
            } else {
              prefixes.add("/content/");
            }
          }
          invalidateOpinlyCache([...prefixes]);
        }

        console.log(
          `Opinly webhook ${payload.type ?? "unknown"}: invalidated ${paths.length} path(s)`,
        );
        return Response.json({ ok: true, invalidated: paths.length });
      },
    },
  },
});
