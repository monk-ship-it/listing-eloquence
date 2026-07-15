import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listGenerationsTool from "./tools/list_generations";
import getGenerationTool from "./tools/get_generation";

// See tanstack-app-mcp-server: the OAuth issuer must be the direct Supabase host
// (SUPABASE_URL is rewritten to the .lovable.cloud proxy on publish and mcp-js
// rejects that at token verification). VITE_SUPABASE_PROJECT_ID is inlined at
// build time by Vite; the fallback keeps the issuer well-formed during the
// throwaway manifest-extract eval and never verifies a real token.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "quill-mcp",
  title: "Quill by CopyByMonk",
  version: "0.1.0",
  instructions:
    "Tools for Quill, the AI listing writer for UK estate agents and US real estate agents. Use list_generations to see the signed-in agent's recent listings and get_generation to fetch the full text (headline, listing body, summary, social posts) of a specific one.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listGenerationsTool, getGenerationTool],
});
