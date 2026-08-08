import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GuideLayout,
  GuideH2,
  GuideH3,
  GuideP,
  GuideList,
  GuideExample,
  GuideFaqs,
  GuideCta,
} from "@/components/guides/GuideLayout";
import { guide, guideHead } from "@/lib/guides";

const META = guide("/mls-remarks-examples");

const FAQS = [
  {
    q: "How long should MLS public remarks be?",
    a: "Write to your MLS field limit, which is often around 1,000 characters. Aim to land comfortably inside it rather than at the ceiling, and put the strongest facts in the first two lines because many portals truncate there.",
  },
  {
    q: "What belongs in private remarks instead of public remarks?",
    a: "Showing instructions, lockbox and access details, occupancy notes, seller motivation and commission details. Public remarks describe the property; private remarks coordinate the transaction.",
  },
  {
    q: "Is this fair housing legal advice?",
    a: "No. This guide is general marketing guidance, not legal advice. Follow your brokerage's compliance policy and your local MLS rules, and take legal questions to your broker or counsel.",
  },
  {
    q: "Can I mention schools or neighborhood safety?",
    a: "Be careful. Naming an assigned school district as a verifiable fact is different from ranking schools or characterizing a neighborhood as safe or family-friendly. Describe the property and let buyers evaluate the area themselves.",
  },
];

export const Route = createFileRoute("/mls-remarks-examples")({
  head: () => guideHead(META, FAQS),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      meta={META}
      standfirst="MLS public remarks have a tight character budget and a specific job: describe the property accurately, in a way that survives truncation on syndicated portals. These examples and templates cover four common listing types, plus wording habits that keep copy focused on the home rather than on who might buy it."
    >
      <GuideH2 id="anatomy">The anatomy of strong public remarks</GuideH2>
      <GuideP>
        Remarks are read in fragments. A buyer sees the first line inside a search card, the first
        two or three lines on the listing detail page, and the rest only if the photos have already
        earned attention. Structure accordingly.
      </GuideP>
      <GuideList
        items={[
          "Line 1 — Property type, bed/bath count, and the single most marketable feature.",
          "Lines 2–4 — Interior walkthrough: main living areas, kitchen finishes, primary suite.",
          "Lines 5–6 — Systems and updates with years, then lot, outdoor space and garage.",
          "Close — HOA, taxes and any disclosure-relevant fact stated plainly, no sales language.",
        ]}
      />
      <GuideP>
        Two habits do most of the work: give numbers instead of adjectives, and date every update. “
        Updated kitchen” is filler; “quartz counters and gas range, 2022” is a reason to book a
        showing.
      </GuideP>

      <GuideH2 id="single-family">Example 1 — Suburban single-family home</GuideH2>
      <GuideExample title="Public remarks">
        <p>
          Four-bedroom, 2.5-bath colonial on a quarter-acre corner lot with a first-floor office and
          a fenced backyard. The two-story foyer opens to a formal dining room and a family room
          with a gas fireplace and built-in shelving.
        </p>
        <p>
          The kitchen was renovated in 2022 with quartz counters, a gas range, a vented hood and a
          walk-in pantry, and opens to a breakfast area with sliders to a 16x14 composite deck.
          Upstairs, the primary suite has a walk-in closet and a bath with a double vanity and a
          tiled shower; three secondary bedrooms share a full hall bath.
        </p>
        <p>
          The finished lower level adds a recreation room and a half bath. Roof 2019, HVAC 2021,
          water heater 2023. Two-car attached garage with interior access. Approx. 2,480 sq ft. HOA
          $45/month covers common area maintenance. Taxes per public record.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "The lot, bed/bath count and office appear in line one, where truncation happens.",
          "Every system carries a year, which pre-answers the most common inspection questions.",
          "Deck dimensions and square footage are given as approximate — accurate without overstating.",
          "The close is factual: HOA amount, what it covers, and taxes referred to public record.",
        ]}
      />

      <GuideH2 id="condo">Example 2 — Urban condominium</GuideH2>
      <GuideExample title="Public remarks">
        <p>
          Two-bedroom, two-bath corner unit on the 11th floor with floor-to-ceiling windows on two
          exposures and a deeded garage space. Open living and dining area with wide-plank flooring
          throughout.
        </p>
        <p>
          The kitchen has stainless appliances, a gas cooktop and a peninsula island seating three.
          The primary bedroom has an en-suite bath with a double vanity; the second bedroom has a
          closet and adjacent full bath, workable as a guest room or office. In-unit washer and
          dryer.
        </p>
        <p>
          Building amenities include a 24-hour desk, fitness room, package room and a roof deck. HOA
          $612/month includes water, sewer, trash, gas and amenity access; owner pays electric.
          Investor-friendly rental policy with a 30-day minimum. Approx. 1,140 sq ft.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "The dues figure and exactly what it includes appear in the remarks, not just the fields.",
          "Rental policy is stated because it determines whether a whole buyer segment can proceed.",
          "The second bedroom is described by what it contains, then by what it could be used for.",
          "No claim about views or “luxury” — exposures and floor level do that job factually.",
        ]}
      />

      <GuideH2 id="ranch">Example 3 — Updated ranch</GuideH2>
      <GuideExample title="Public remarks">
        <p>
          Three-bedroom, two-bath ranch on a level 0.31-acre lot, single level with no interior
          steps. The living room opens to a dining area and a 2023 kitchen with shaker cabinetry,
          quartz counters and a pantry wall.
        </p>
        <p>
          The primary bedroom has a renovated en-suite bath with a curbless shower; two additional
          bedrooms share a full bath with a tub. Original hardwood floors were refinished in 2023.
          Laundry is on the main level off the kitchen.
        </p>
        <p>
          Outside there is a screened porch, a detached two-car garage and a storage shed. Public
          water and sewer. Roof 2018, furnace 2020, central air 2020. Approx. 1,620 sq ft. No HOA.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "“Single level with no interior steps” describes the property, not the buyer who might want it.",
          "Renovation years appear next to each item so the buyer can price remaining work.",
          "Utilities are specified, which matters in markets with a mix of well, septic and public service.",
          "“No HOA” is a fact worth stating; it removes a filter question.",
        ]}
      />

      <GuideH2 id="luxury">Example 4 — Higher-price listing</GuideH2>
      <GuideExample title="Public remarks">
        <p>
          Five-bedroom, 4.5-bath custom home on 1.2 acres with a first-floor primary suite, a
          three-car garage and a heated pool. Approx. 4,150 sq ft across two levels.
        </p>
        <p>
          The entry opens to a study with built-ins and a dining room with wainscoting. The great
          room has a 20-foot ceiling, a stone fireplace and a wall of glass to the rear terrace. The
          kitchen has a 48-inch range, two dishwashers, a butler's pantry and a marble-topped
          island; a scullery sits behind it.
        </p>
        <p>
          The first-floor primary suite has dual closets and a bath with a freestanding tub and a
          wet-room shower. Four bedrooms upstairs, three with en-suite baths. Lower level is
          unfinished with rough-in plumbing.
        </p>
        <p>
          Grounds include a heated saltwater pool with an automatic cover, a paver patio and
          irrigated lawn. Well and septic; generator hookup installed 2021. HOA $1,200/year covers
          road maintenance.
        </p>
      </GuideExample>

      <GuideH2 id="fair-housing">Fair-housing-conscious wording habits</GuideH2>
      <GuideP>
        This is marketing guidance, not legal advice — your broker and local MLS rules govern. That
        said, the practical writing discipline is consistent: describe the property, its features
        and its measurable facts, and avoid language that describes, targets or excludes a type of
        person.
      </GuideP>
      <GuideList
        items={[
          "Describe the home, not the buyer: “first-floor primary suite” rather than “perfect for retirees”.",
          "Avoid characterizing the neighborhood or its residents — no “safe”, “quiet family area”, “exclusive”.",
          "Name assigned districts only as verifiable facts; skip rankings, scores and quality claims.",
          "Skip references to religion, national origin, family status, disability, or nearby places of worship.",
          "Replace “walking distance” with an actual distance where you can, and let the buyer judge access.",
          "State accessibility features factually — curbless shower, 36-inch doorways, zero-step entry.",
          "Keep occupancy and seller-circumstance details out of public remarks entirely.",
        ]}
      />

      <GuideH2 id="template">A reusable remarks template</GuideH2>
      <GuideExample title="Fill in from your listing sheet">
        <p>
          [Beds]-bedroom, [baths]-bath [style] on [lot size / floor and exposure] with [single
          strongest feature] and [parking].
        </p>
        <p>
          [Entry / main living area and its notable detail]. The kitchen has [counters, appliances,
          island, pantry], opening to [dining / deck / patio].
        </p>
        <p>
          The primary bedroom has [closet, bath detail]; [remaining bedrooms and baths]. [Laundry
          location.] [Lower level / bonus space status.]
        </p>
        <p>
          Outside: [outdoor structures, yard, fencing]. Systems: [roof year, HVAC year, water heater
          year]. Utilities: [public / well / septic].
        </p>
        <p>
          Approx. [sq ft]. [HOA amount and what it covers, or “No HOA”.] [Rental policy if condo.]
        </p>
      </GuideExample>

      <GuideH2 id="faqs">FAQs</GuideH2>
      <GuideFaqs faqs={FAQS} />

      <GuideCta meta={META} label="Generate MLS-ready remarks from your listing facts" />

      <GuideP>
        For longer marketing copy beyond the MLS field, see{" "}
        <Link
          to="/real-estate-listing-description-examples"
          className="underline underline-offset-4 hover:text-foreground"
        >
          real estate listing description examples
        </Link>{" "}
        or browse the{" "}
        <Link to="/blog" className="underline underline-offset-4 hover:text-foreground">
          guides hub
        </Link>
        .
      </GuideP>
    </GuideLayout>
  );
}
