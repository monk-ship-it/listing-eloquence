import { createFileRoute } from "@tanstack/react-router";

/** Retired US page — permanently redirected to its UK equivalent. */
export const Route = createFileRoute("/us-real-estate-listing-generator")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 301,
          headers: { Location: "https://copybymonk.com/uk-property-listing-generator" },
        }),
    },
  },
});
