import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reserve: vi.fn(), settle: vi.fn(), extraction: vi.fn(), marketing: vi.fn(), transcription: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = { middleware: () => builder, inputValidator: () => builder, handler: (fn: unknown) => fn };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }) } }));
vi.mock("./provider-quota", () => ({ reserveProviderCall: mocks.reserve, settleProviderCall: mocks.settle }));
vi.mock("./generation.server", () => ({ runCore: vi.fn(), runExtraction: mocks.extraction, runMarketing: mocks.marketing }));
vi.mock("./transcription.server", () => ({ callTranscription: mocks.transcription }));
vi.mock("./subscription.functions", () => ({ hasActiveAccess: () => true, readReconciledSubscriber: async () => ({ status: "active" }) }));
vi.mock("./comped.server", () => ({ isCompedUserId: () => false }));

import { extractListingFields } from "./extract.functions";
import { transcribeAudio } from "./transcribe.functions";
import { generateMarketingForGeneration } from "./listing.functions";

const userId = "00000000-0000-4000-8000-000000000001";
const reservation = "00000000-0000-4000-8000-000000000002";
const listingId = "00000000-0000-4000-8000-000000000003";
function context() {
  const query = {
    select() { return this; }, eq() { return this; },
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: listingId, voice: "professional", inputs: {}, output: { sellerApproval: { confirmed: true } } }, error: null }),
    update: vi.fn().mockReturnThis(),
    then(resolve: (value: { error: null }) => unknown) { return Promise.resolve(resolve({ error: null })); },
  };
  return { userId, supabase: { from: () => query }, query };
}
const invoke = (fn: unknown, data: unknown, ctx = context()) =>
  (fn as (request: { data: unknown; context: unknown }) => Promise<unknown>)({ data, context: ctx });

const cases = [
  { name: "extraction", fn: extractListingFields, data: { voiceNotes: "Three bedrooms and two bathrooms." }, provider: mocks.extraction, kind: "extract", bytes: undefined },
  { name: "marketing", fn: generateMarketingForGeneration, data: { generationId: listingId }, provider: mocks.marketing, kind: "marketing", bytes: undefined },
  { name: "transcription", fn: transcribeAudio, data: { file: new File(["audio"], "note.webm"), lang: "en-GB", type: "audio/webm" }, provider: mocks.transcription, kind: "transcribe", bytes: 5 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reserve.mockResolvedValue(reservation); mocks.settle.mockResolvedValue(undefined);
  mocks.extraction.mockResolvedValue({ fields: {}, conflicts: [] });
  mocks.marketing.mockResolvedValue({ emailBlast: null, social: [] });
  mocks.transcription.mockResolvedValue("Three bedrooms.");
});

describe("authenticated handler provider budget gates", () => {
  it.each(cases)("$name invokes no paid provider when its reservation fails", async ({ fn, data, provider }) => {
    mocks.reserve.mockRejectedValue(new Error("BUDGET_UNAVAILABLE"));
    await expect(invoke(fn, data)).rejects.toThrow("BUDGET_UNAVAILABLE");
    expect(provider).not.toHaveBeenCalled(); expect(mocks.settle).not.toHaveBeenCalled();
  });

  it.each(cases)("$name reserves its verified user before paid work and settles success", async ({ fn, data, provider, kind, bytes }) => {
    await invoke(fn, data);
    const args = mocks.reserve.mock.calls[0];
    expect(args.slice(1)).toEqual(bytes === undefined ? [userId, kind] : [userId, kind, bytes]);
    expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(provider.mock.invocationCallOrder[0]);
    expect(mocks.settle).toHaveBeenCalledWith(expect.anything(), userId, reservation, true);
  });

  it("does not retain seller approval when saved marketing copy changes", async () => {
    const ctx = context();
    await invoke(generateMarketingForGeneration, { generationId: listingId }, ctx);
    expect(ctx.query.update.mock.calls[0][0].output).not.toHaveProperty("sellerApproval");
  });
});
