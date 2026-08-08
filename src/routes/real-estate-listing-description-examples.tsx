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

const META = guide("/real-estate-listing-description-examples");

const FAQS = [
  {
    q: "How is a listing description different from MLS remarks?",
    a: "MLS remarks are constrained by a character limit and syndicate everywhere. A listing description on your own site, a single-property page or a social post can run longer and carry more voice, as long as the facts stay identical.",
  },
  {
    q: "Which tone should I use?",
    a: "Match the buyer and the price point, then stay consistent across the listing, the email and the captions. A first-time-buyer condo and a $2M custom home should not sound the same, but both should sound like your brand.",
  },
  {
    q: "Should I write the description before or after the photo shoot?",
    a: "After, if you can. Photographs tell you which features actually read well, and writing to the images keeps the order of the description aligned with the order the buyer scrolls.",
  },
  {
    q: "How do I avoid sounding like every other listing?",
    a: "Cut the stock adjectives and replace them with specifics only your listing has: a dated renovation, a measured room, a named material, a real distance. Specificity is what makes copy sound human.",
  },
];

export const Route = createFileRoute("/real-estate-listing-description-examples")({
  head: () => guideHead(META, FAQS),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      meta={META}
      standfirst="A listing description outside the MLS field has room to do more work — set a scene, explain a layout, answer objections. These examples cover four home types, and the final section rewrites the same property in three tones so you can see exactly how voice changes without the facts moving."
    >
      <GuideH2 id="framework">A framework you can reuse on any home</GuideH2>
      <GuideP>
        Buyers read listing descriptions with two questions: does this fit my life, and what is
        wrong with it? Good copy answers the first quickly and treats the second honestly. The shape
        below holds up across price points.
      </GuideP>
      <GuideList
        items={[
          "Open with the defining fact — the layout, the lot, the location, or the renovation.",
          "Walk the main level in the order a buyer would experience it, naming materials and measurements.",
          "Handle bedrooms and baths as a group, then flex spaces (office, bonus room, basement).",
          "Cover outdoor space, garage and systems with years attached.",
          "Close with ownership facts — HOA, taxes, utilities — and a specific next step.",
        ]}
      />

      <GuideH2 id="condo">Example 1 — Starter condo</GuideH2>
      <GuideExample title="Listing description">
        <p>
          A one-bedroom, one-bath condo on the top floor of a well-kept four-unit building, five
          blocks from the light rail. It is the kind of first home that does not need a project
          list: the kitchen was replaced in 2023, the windows in 2021, and the building reroofed the
          year before that.
        </p>
        <p>
          The living room takes the front of the unit, with two south-facing windows and enough wall
          for a sofa and a desk. The kitchen sits behind it with quartz counters, a slide-in
          electric range and a dishwasher, plus a peninsula that seats two. The bedroom holds a
          queen bed with side tables and has a reach-in closet with a double rod. The bath has a
          tub-shower and a new vanity.
        </p>
        <p>
          Storage is the surprise: a deeded basement locker plus a hall closet that fits a bike. One
          off-street parking space is assigned. Laundry is shared in the basement, two machines for
          four units.
        </p>
        <p>
          HOA is $210/month and covers water, sewer, trash, exterior maintenance and the shared
          laundry. Approx. 640 sq ft. Cats and dogs permitted under 40 lbs. No rental cap currently
          in place — confirm with the association before writing an offer.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "The second sentence answers the biggest first-time-buyer fear: hidden capital costs.",
          "Furniture-scale detail (“holds a queen bed with side tables”) is more useful than “spacious”.",
          "Shared laundry is disclosed with the machine count instead of being quietly omitted.",
          "The rental note directs the buyer to verify rather than asserting a fact you don't control.",
        ]}
      />

      <GuideH2 id="new-build">Example 2 — New construction</GuideH2>
      <GuideExample title="Listing description">
        <p>
          A four-bedroom, three-bath new build on a 0.28-acre lot, finished this year and ready for
          immediate occupancy. Approx. 2,690 sq ft over two levels, with a first-floor guest suite
          and a two-car garage prepped for an EV charger.
        </p>
        <p>
          The main level runs open from the front entry: a great room with a linear gas fireplace, a
          dining area, and a kitchen with a 36-inch gas range, a vented hood, quartz counters and a
          nine-foot island with waterfall ends. A walk-in pantry and a mudroom with built-in benches
          sit off the garage entry. The guest suite has a full bath with a walk-in shower.
        </p>
        <p>
          Upstairs, the primary suite has two walk-in closets and a bath with a double vanity, a
          freestanding tub and a tiled shower with a bench. Two more bedrooms share a hall bath with
          separate vanities, and the laundry room is on the same floor with a sink and folding
          counter.
        </p>
        <p>
          The rear yard is graded and seeded with a 12x20 patio poured off the great room; fencing
          is not installed. Systems are new throughout, with a 96% efficiency furnace, a heat-pump
          water heater and a builder warranty transferring to the buyer. HOA $600/year covers the
          entrance and stormwater basin. Taxes will be reassessed after closing.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "What is not included — fencing — is stated, which prevents a walkthrough argument later.",
          "The tax reassessment note manages the single most common new-construction surprise.",
          "Warranty transfer is a genuine differentiator and gets its own clause.",
          "Specific equipment sizes and efficiencies replace the word “premium” entirely.",
        ]}
      />

      <GuideH2 id="ranch">Example 3 — Single-level ranch on acreage</GuideH2>
      <GuideExample title="Listing description">
        <p>
          A three-bedroom, two-bath ranch on 2.4 acres, set back from the road with a gravel
          circular drive and a detached 24x30 shop with 220V power.
        </p>
        <p>
          Inside, the floor plan is single level with no interior steps and a zero-step entry from
          the garage. The living room has a wood stove on a brick hearth and a picture window facing
          the tree line. The kitchen was updated in 2021 with butcher-block counters, a farmhouse
          sink and a gas range, and opens to a dining space with room for eight.
        </p>
        <p>
          The primary bedroom is at the quiet end of the house with an en-suite bath and a curbless
          shower. The two remaining bedrooms share a full bath with a tub. Laundry is in a dedicated
          room with a utility sink.
        </p>
        <p>
          The land is a mix of cleared pasture and mixed hardwood, fenced on three sides. Water is
          from a drilled well with a 2020 pressure tank; waste is a conventional septic system
          serviced in 2024. Roof 2017. Propane heat with an owned tank. No HOA and no covenants
          recorded.
        </p>
      </GuideExample>

      <GuideH2 id="luxury">Example 4 — Higher-price listing</GuideH2>
      <GuideExample title="Listing description">
        <p>
          A five-bedroom waterfront home on 0.9 acres with 140 feet of frontage, a private dock and
          a first-floor primary suite. Approx. 4,600 sq ft, rebuilt to the studs in 2019.
        </p>
        <p>
          The rear of the house is glass from the great room through the kitchen, so the water is
          visible from the moment you enter. The kitchen has a 48-inch dual-fuel range, two
          dishwashers, a marble island and a scullery with a second sink and a beverage column. The
          dining room seats twelve and opens to a screened porch with an outdoor fireplace.
        </p>
        <p>
          The primary suite occupies the west wing with a private terrace, dual closets and a bath
          finished in honed stone with a wet room. Four bedrooms upstairs, three en-suite, plus a
          bonus room over the garage currently used as a gym.
        </p>
        <p>
          Grounds include an irrigated lawn, a paver terrace with a built-in grill, and a dock with
          power, water and a boat lift installed 2022. Whole-house generator, three-zone HVAC, and a
          conditioned crawl space. Flood zone designation and elevation certificate available on
          request.
        </p>
      </GuideExample>

      <GuideH2 id="tones">The same home in three tones</GuideH2>
      <GuideP>
        Tone should change the sentence rhythm and the vocabulary, never the facts. All three
        versions below describe the same 1,620 sq ft ranch with a 2023 kitchen and a screened porch.
      </GuideP>
      <GuideExample title="Warm and conversational">
        <p>
          Three bedrooms, two baths, one level, and a screened porch you will use from April to
          October. The 2023 kitchen has quartz counters and a pantry wall that finally fits a week
          of groceries, and the refinished hardwood runs through the living and dining rooms.
          Detached two-car garage, level 0.31-acre lot, no HOA. Approx. 1,620 sq ft.
        </p>
      </GuideExample>
      <GuideExample title="Precise and factual">
        <p>
          Single-level three-bedroom, two-bath ranch, approx. 1,620 sq ft on 0.31 acres. Kitchen
          renovated 2023 with quartz counters and shaker cabinetry; hardwood floors refinished 2023.
          Primary bedroom with en-suite bath and curbless shower. Screened porch, detached two-car
          garage, public water and sewer. Roof 2018, furnace and central air 2020. No HOA.
        </p>
      </GuideExample>
      <GuideExample title="Elevated and understated">
        <p>
          A quietly updated ranch on a level third of an acre, arranged on a single floor. The 2023
          kitchen keeps to quartz and painted shaker cabinetry; the hardwood, refinished the same
          year, carries through the main rooms. A screened porch faces the rear lawn, with a
          detached two-car garage beyond it. Approx. 1,620 sq ft. Roof 2018, mechanicals 2020. No
          HOA.
        </p>
      </GuideExample>
      <GuideP>
        Whichever voice you pick, keep it consistent across the MLS remarks, your email campaign and
        your captions. Buyers notice when the tone changes between channels, and a mismatch reads as
        carelessness.
      </GuideP>

      <GuideH2 id="mistakes">Habits worth dropping</GuideH2>
      <GuideList
        items={[
          "Stock openers — “welcome home”, “step inside”, “nestled” — that consume the truncated preview.",
          "All-caps emphasis, which portals often strip and which reads as shouting.",
          "Describing the ideal buyer rather than the property.",
          "Claiming updates without years, which invites the buyer to assume the worst.",
          "Recycling last year's description for a relisting without checking every fact again.",
        ]}
      />

      <GuideH2 id="faqs">FAQs</GuideH2>
      <GuideFaqs faqs={FAQS} />

      <GuideCta meta={META} label="Get a full listing pack from one set of facts" />

      <GuideP>
        Writing for the MLS field specifically? See{" "}
        <Link
          to="/mls-remarks-examples"
          className="underline underline-offset-4 hover:text-foreground"
        >
          MLS remarks examples and templates
        </Link>
        , or browse the{" "}
        <Link to="/blog" className="underline underline-offset-4 hover:text-foreground">
          guides hub
        </Link>
        .
      </GuideP>
    </GuideLayout>
  );
}
