import { createFileRoute } from "@tanstack/react-router";

/**
 * Disabled: Quill does not send transactional email from user requests.
 * The previous handler let any signed-in user queue branded mail to any
 * address with arbitrary template data. Kept as a closed route so the path
 * cannot be reused accidentally.
 */
const disabled = () => Response.json({ error: "Not available" }, { status: 404 });

export const Route = createFileRoute("/lovable/email/transactional/send")({
  server: {
    handlers: {
      GET: disabled,
      POST: disabled,
    },
  },
});
