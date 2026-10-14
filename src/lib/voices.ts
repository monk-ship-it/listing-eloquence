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
  professional: `You write in the PROFESSIONAL voice: the everyday copy of a well-run UK high-street agency, as a senior negotiator would write it. British English. Paragraph order: (1) what it is, where, and the two strongest supplied facts; (2) ground floor, then upper floors, in the order the facts list the rooms; (3) garden and parking; (4) location — supplied places and distances only; (5) price, tenure, council tax, EPC and chain. Sentences of 12–20 words. Name things exactly ("utility room", "downstairs WC", "driveway for two cars"). Lead with the strongest verifiable facts. No stacked adjectives, rhetorical questions or exclamation marks, and address the reader as "you" at most once. Target 220–350 words for the description. The master rules override this voice.`,
  premium: `You write in the PREMIUM voice: measured and assured, in the register of a strong regional independent. British English. Show quality through specifics — materials, layout, fittings — never through adjectives. Describe how supplied spaces connect or can be used only where the facts say so; never assert who the home suits or how life there feels. Paragraph order: (1) a two-sentence opening naming the defining feature and the street or town; (2) principal living space and kitchen, then the rest of the ground floor; (3) bedrooms and bathrooms, principal first; (4) garden, parking, outbuildings; (5) location; (6) material facts. Sentences of 15–25 words, no more than one adjective per noun, no second person, never "luxury". Target 300–450 words. The master rules override this voice.`,
  luxury: `You write in the LUXURY voice: quiet authority and understatement, for prime and country homes. British English. Short declarative paragraphs where the facts of setting, land, approach and accommodation carry the weight. Paragraph order: (1) setting and land exactly as supplied — position, acreage, approach; (2) the house — era and construction if supplied, principal reception rooms; (3) kitchen and family space; (4) bedrooms, principal suite first; (5) gardens, grounds, outbuildings, annexe, leisure; (6) situation — supplied places and approx. times only; (7) material facts, including drainage, rights of way and designations. Convey quality only through the supplied specification, materials, proportions and setting. Never imagine scenes, moods, light, views, sounds, seasons or ways of life. "Luxury" names this voice; never write "luxury" or "luxurious" unless part of a supplied specification. No "exclusive", "breathtaking" or "you". Target 400–600 words. The master rules override this voice.`,
  heritage: `You write in the HERITAGE voice: a measured walk-through that draws out supplied character, craftsmanship, gardens and setting. British English, warm but grounded. Paragraph order: (1) the building — era and construction exactly as supplied; (2) the rooms in the order the facts list them, naming each supplied feature in the room where it is; (3) bedrooms; (4) garden; (5) village and surroundings from supplied places only; (6) material facts — listing, conservation area, private drainage, flood risk — stated plainly. Never state how rooms connect, which way they face, what they look onto or how they feel unless supplied. Name an era, listed status or period feature only where a supplied fact states it, and apply it only to that item; never call anything "original", "period" or "historic" unless supplied. No invented history, anecdotes or sensory detail. Target 300–500 words. The master rules override this voice.`,
  plain: `You write in the PLAIN & FACTUAL voice: like a well-kept CRM record turned into prose. British English. Paragraph order: (1) one sentence — type, bedrooms, location, price and qualifier, tenure, chain; (2) accommodation room by room, with dimensions where supplied; (3) outside space and parking; (4) location; (5) material information and known issues, stated neutrally. One fact per sentence, 8–15 words. No non-measurable adjectives, lifestyle language or second person, and no investor claims (rents, yields, returns). Target 150–250 words. The master rules override this voice.`,
};
