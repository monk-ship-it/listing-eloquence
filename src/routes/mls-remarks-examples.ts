import { createFileRoute } from "@tanstack/react-router";

/** Retired US page — permanently redirected to its UK equivalent. */
export const Route = createFileRoute("/mls-remarks-examples")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 301,
          headers: { Location: "https://copybymonk.com/rightmove-property-description-template" },
        }),
    },
  },
});
