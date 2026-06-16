export type VoiceId = "professional" | "premium" | "luxury" | "heritage";

export interface VoiceMeta {
  id: VoiceId;
  name: string;
  tagline: string;
  descriptor: string;
  description: string;
}

export const VOICES: VoiceMeta[] = [
  {
    id: "professional",
    name: "Professional",
    tagline: "Clear · Polished · Direct",
    descriptor: "Refined, confident, lifestyle-aware",
    description:
      "The everyday voice for high-street and independent agencies. Confident, well-structured copy that reads like a senior negotiator wrote it.",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Restrained · Understated · Considered",
    descriptor: "Restrained, understated, considered",
    description:
      "For agencies selling at the upper end of the market. Slightly more lifestyle-led, with care taken over rhythm and phrasing.",
  },
  {
    id: "luxury",
    name: "Luxury",
    tagline: "Quiet authority · Considered language",
    descriptor: "Warm, cinematic, story-led",
    description:
      "For prime and country homes where less is more. Quiet authority, considered language, no overblown adjectives.",
  },
  {
    id: "heritage",
    name: "Heritage",
    tagline: "Atmosphere · Detail · Local charm",
    descriptor: "Warm, cinematic, story-led",
    description:
      "For homes with character, period features, history, mature gardens or village settings. A guided walk-through with atmosphere and local charm — premium but never overblown.",
  },
];

export const VOICE_PROMPTS: Record<VoiceId, string> = {
  professional: `You write in the PROFESSIONAL voice — refined, confident and lifestyle-aware. This is the everyday voice for UK high-street and independent agencies. The copy should read as though a senior negotiator wrote it: clear, well-structured, persuasive but never gimmicky. Use British English. Lead with the strongest selling points, keep sentences purposeful, and balance practical detail with a light sense of lifestyle. Avoid clichés ("nestled", "must be viewed to be appreciated"), avoid hype and exclamation marks.`,
  premium: `You write in the PREMIUM voice — restrained, understated and considered, for agencies selling at the upper end of the market. The writing is slightly more lifestyle-led, with real care taken over rhythm and phrasing. Use British English. Favour elegant, measured sentences; let quality speak for itself rather than overselling. Subtle, tasteful, never flashy. No exclamation marks, no estate-agent clichés.`,
  luxury: `You write in the LUXURY voice — warm, cinematic and story-led, for prime and country homes where less is more. Convey quiet authority with considered language and absolutely no overblown adjectives. Use British English. Set a scene, evoke atmosphere and a way of life, but stay disciplined and sparing. Short, confident paragraphs. Understatement is the height of luxury. Never use words like "stunning", "amazing", "luxurious" as filler.`,
  heritage: `You write in the HERITAGE voice — a guided walk-through with atmosphere, detail and local charm, for homes with character, period features, history, mature gardens or village settings. Premium but never overblown. Use British English. Take the reader through the property as if walking them around it, drawing out period detail, craftsmanship, the garden and the setting, with a warm sense of place and local context. Evocative but grounded and accurate.`,
};
