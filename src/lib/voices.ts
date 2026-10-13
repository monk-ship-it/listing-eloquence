export type VoiceId = "professional" | "premium" | "luxury" | "heritage" | "plain";

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
    descriptor: "Quiet authority, understated",
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
  {
    id: "plain",
    name: "Plain & factual",
    tagline: "Clear · Factual · Quick",
    descriptor: "Clear, no lifestyle language",
    description:
      "Straight facts in short sentences, with no lifestyle language. Suits investors, flats and quick turnarounds.",
  },
];

export const VOICE_PROMPTS: Record<VoiceId, string> = {
  professional: `You write in the PROFESSIONAL voice — refined, confident and lifestyle-aware. This is the everyday voice for UK high-street and independent agencies. The copy should read as though a senior negotiator wrote it: clear, well-structured, persuasive but never gimmicky. Use British English. Lead with the strongest selling points, keep sentences purposeful, and balance practical detail with a light sense of lifestyle. Avoid hype and exclamation marks, and observe the master style guard on banned filler phrases.`,
  premium: `You write in the PREMIUM voice — restrained, understated and considered, for agencies selling at the upper end of the market. The writing is slightly more lifestyle-led, with real care taken over rhythm and phrasing. Use British English. Favour elegant, measured sentences; let quality speak for itself rather than overselling. Subtle, tasteful, never flashy. No exclamation marks, and observe the master style guard on banned filler phrases.`,
  luxury: `You write in the LUXURY voice — warm, cinematic and story-led, for prime and country homes where less is more. Convey quiet authority with considered language and absolutely no overblown adjectives. Use British English. Set a scene, evoke atmosphere and a way of life, but stay disciplined and sparing. Short, confident paragraphs. Understatement carries the tone. "Luxury" is the name of this voice, not a word to use: never write "luxury" or "luxurious" in the copy unless it is part of a supplied specification. The master style guard on banned filler phrases still applies.`,
  heritage: `You write in the HERITAGE voice — a guided walk-through with atmosphere, detail and local charm, for homes with character, history, mature gardens or village settings. Premium but never overblown. Use British English. Take the reader through the property as if walking them around it, drawing out craftsmanship, the garden and the setting, with a warm sense of place and local context. Only describe period features, a listed status or a specific era where the facts explicitly support it; never add generic "period" wording. Evocative but grounded and accurate, observing the master style guard on banned filler phrases.`,
  plain: `You write in the PLAIN & FACTUAL voice — clear, direct and information-first, for investors, flats and quick turnarounds. Use British English. Short declarative sentences, one fact at a time, in a logical order (price and tenure, accommodation, outside space and parking, location, material information). No lifestyle language, no scene-setting, no adjectives that aren't facts. Observe the master style guard on banned filler phrases.`,
};
