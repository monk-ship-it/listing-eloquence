import { createFileRoute } from "@tanstack/react-router";

// This unused browser-callable sender accepted arbitrary recipients and links.
// Keep the route closed without reading credentials, the request body or any
// database tables. Auth email delivery and the trusted queue worker are separate.
export const Route = createFileRoute("/lovable/email/transactional/send")({
  server: {
    handlers: {
      ANY: () => Response.json(
        { error: "Transactional email sending is unavailable." },
        { status: 410, headers: { "Cache-Control": "no-store" } },
      ),
    },
  },
});
