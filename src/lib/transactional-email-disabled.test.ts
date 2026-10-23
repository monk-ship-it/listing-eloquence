import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
import { Route } from "../routes/lovable/email/transactional/send";
afterEach(() => vi.unstubAllGlobals());

describe("retired public transactional sender", () => {
  it.each([undefined, "Bearer ordinary-user", "Bearer privileged-looking-token"])("rejects every caller without reading private data or sending", async (authorization) => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const bodyRead = vi.fn(() => { throw new Error("Request bodies must not be read"); });
    const request = { headers: new Headers(authorization ? { authorization } : {}), json: bodyRead };
    const handler = (Route as unknown as { server: { handlers: { ANY: (ctx: unknown) => Response } } }).server.handlers.ANY;
    const response = handler({ request });
    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "Transactional email sending is unavailable." });
    expect(bodyRead).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });
});
