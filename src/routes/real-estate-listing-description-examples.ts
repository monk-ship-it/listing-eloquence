import { createFileRoute } from "@tanstack/react-router";

/** Retired US page — permanently redirected to its UK equivalent. */
export const Route = createFileRoute("/real-estate-listing-description-examples")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 301,
          headers: { Location: "https://copybymonk.com/property-description-examples" },
        }),
    },
  },
});
