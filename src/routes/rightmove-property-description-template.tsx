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

const META = guide("/rightmove-property-description-template");

const FAQS = [
  {
    q: "Is this template official?",
    a: "No. CopyByMonk is not affiliated with, endorsed by or connected to Rightmove in any way. This is an independent template written in the house style commonly used on UK property portals, and you should always follow your own agency's rules and the portal's current guidance.",
  },
  {
    q: "How many key features should a listing have?",
    a: "Six to ten works well. Fewer looks thin next to competing listings; more and the reader stops reading. Keep each one short, factual and non-repetitive.",
  },
  {
    q: "Where do tenure, EPC and council tax go?",
    a: "Treat them as facts near the end of the description and in the dedicated portal fields. Keeping them consistent in both places avoids the mismatch that triggers buyer questions.",
  },
  {
    q: "Should the same copy go on the portal and the window card?",
    a: "Use the same facts, but not the same length. A window card needs the opening line and the strongest three features; the portal listing can carry the full walkthrough.",
  },
];

export const Route = createFileRoute("/rightmove-property-description-template")({
  head: () => guideHead(META, FAQS),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      meta={META}
      standfirst="Use this template as a repeatable structure for UK portal listings: an opening hook, a room-by-room walkthrough, outside space, location, then the factual close. Fill in the bracketed prompts from your property notes, then run the pre-publish checklist at the end."
    >
      <GuideP className="sr-only">Template and checklist</GuideP>
      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        CopyByMonk is an independent tool. It is not affiliated with, endorsed by or connected to
        Rightmove, OnTheMarket or Zoopla. “Rightmove-style” here describes a widely used UK portal
        writing convention, not an official specification.
      </div>

      <GuideH2 id="structure">The five-block structure</GuideH2>
      <GuideP>
        Portal listings are scanned in a predictable order: photograph, price, key features, then the
        first two lines of the description. Everything below the second line has to be earned. This
        structure front-loads the decision-making facts and keeps the detail in the order a buyer
        walks the property.
      </GuideP>
      <GuideList
        items={[
          "Block 1 — Hook: property type, standout benefit, location. One sentence.",
          "Block 2 — Accommodation: entrance, reception rooms, kitchen, then upstairs in order.",
          "Block 3 — Outside: garden size and aspect, parking, garage, outbuildings.",
          "Block 4 — Location: transport, schools, high street, with real distances or walking times.",
          "Block 5 — Facts: tenure, council tax band, EPC, service charge and ground rent if leasehold.",
        ]}
      />

      <GuideH2 id="template">The fill-in template</GuideH2>
      <GuideExample title="Copy and complete">
        <p>
          <strong>Hook.</strong> A [number]-bedroom [property type] in [area / street context], with
          [single strongest benefit — extension, garden aspect, parking, view].
        </p>
        <p>
          <strong>Accommodation.</strong> The front door opens into [entrance hall / porch and its
          notable detail]. The [reception room] has [window type, fireplace, dimensions]. The kitchen
          [dimensions] has [worktop material, integrated appliances, table space] and [doors /
          window] to [garden / side return]. [Ground-floor WC, utility, study — include only if
          present.]
        </p>
        <p>
          <strong>Upstairs.</strong> There are [number] bedrooms: the principal bedroom has [wardrobe
          / en-suite / aspect], [bedroom two] is a [double / single] overlooking [front / rear], and
          [bedroom three] currently [use]. The family bathroom has [bath, shower, suite detail].
          [Loft: boarded / ladder / standing height, subject to consents.]
        </p>
        <p>
          <strong>Outside.</strong> The rear garden is approximately [size] and [aspect], laid to
          [lawn / patio / gravel] with [terrace, shed, mature borders]. Parking is [driveway for X
          cars / garage with power / permit zone Y / unrestricted on-street].
        </p>
        <p>
          <strong>Location.</strong> [Station] is [X minutes' walk], [high street / retail park] is
          [X minutes], and [named school] is [distance]. [One line of genuine local context — park,
          market, canal path.]
        </p>
        <p>
          <strong>Facts.</strong> [Freehold / Leasehold with X years remaining, service charge £X per
          year, ground rent £X per year.] Council tax band [X]. EPC rating [X]. [Heating type.]
          [Drainage if not mains.]
        </p>
      </GuideExample>

      <GuideH3>Worked example of the same template</GuideH3>
      <GuideExample title="Completed">
        <p>
          A three-bedroom semi-detached house on a cul-de-sac, extended to the side to create a 20ft
          kitchen-diner with doors to a west-facing garden.
        </p>
        <p>
          The front door opens into a hall with a cloakroom and WC. The sitting room has a bay window
          and a log-burner. The kitchen-diner runs across the rear with quartz worktops, an
          integrated oven, induction hob and dishwasher, space for a six-seat table and French doors
          to the terrace. A utility room off the kitchen holds the washing machine and the boiler,
          serviced annually.
        </p>
        <p>
          Upstairs there are two doubles and a single. The principal bedroom has fitted wardrobes and
          looks over the garden; the second double faces the front; the third takes a single bed and
          a desk. The bathroom has a bath with a shower over and a heated towel rail.
        </p>
        <p>
          The garden is approximately 50ft and west-facing, mainly lawn with a paved terrace off the
          kitchen and a timber shed. The driveway takes two cars.
        </p>
        <p>
          The railway station is a twelve-minute walk, the high street eight minutes, and the
          recreation ground is at the end of the road.
        </p>
        <p>Freehold. Council tax band D. EPC rating C. Gas central heating.</p>
      </GuideExample>

      <GuideH2 id="key-features">Key features: six to ten, no repeats</GuideH2>
      <GuideP>
        Bullets are read before the description, so they should be facts a buyer filters on rather
        than sentences lifted from the prose. Order them by decision weight: tenure and type first,
        then rooms, then the extras.
      </GuideP>
      <GuideList
        items={[
          "Freehold semi-detached house",
          "Three bedrooms, family bathroom, ground-floor WC",
          "20ft extended kitchen-diner with French doors",
          "West-facing garden, approximately 50ft",
          "Driveway parking for two cars",
          "Log-burner in the sitting room",
          "Twelve-minute walk to the station",
          "EPC rating C · Council tax band D",
        ]}
      />

      <GuideH2 id="checklist">Pre-publish checklist</GuideH2>
      <GuideP>
        Run this before the listing goes live. Most portal listing complaints come from a mismatch
        between the description, the bullets and the property fields — not from the writing itself.
      </GuideP>
      <GuideList
        items={[
          "Every number in the description matches the floorplan and the portal fields.",
          "Tenure stated. If leasehold: years remaining, service charge and ground rent included.",
          "Council tax band and EPC rating present and consistent with the certificate.",
          "Heating type stated; drainage stated if it is not mains.",
          "Any known issue disclosed — flying freehold, footpath, restrictive covenant, cladding.",
          "Room order in the text follows the order of the photographs.",
          "No claim you cannot evidence: no invented period features, no unconfirmed catchment.",
          "Bullets do not duplicate each other, and there are between six and ten.",
          "Private access notes, vendor circumstances and viewing instructions removed from public copy.",
          "Read aloud once. If a sentence needs a second read, cut it.",
        ]}
      />

      <GuideH2 id="material-information">Material Information, briefly</GuideH2>
      <GuideP>
        UK listings are expected to carry the material facts a buyer needs before enquiring — tenure,
        council tax band, EPC, and any specific restriction or risk that would affect a decision.
        This guide is not legal advice; follow your agency's compliance process and current portal
        guidance. Practically, the writing habit that keeps you safe is simple: state facts you have
        verified, omit facts you have not, and never let an adjective imply a fact.
      </GuideP>

      <GuideH2 id="faqs">FAQs</GuideH2>
      <GuideFaqs faqs={FAQS} />

      <GuideCta meta={META} label="Fill this template automatically from your notes" />

      <GuideP>
        For finished copy rather than a template, see{" "}
        <Link
          to="/property-description-examples"
          className="underline underline-offset-4 hover:text-foreground"
        >
          UK property description examples
        </Link>{" "}
        or the{" "}
        <Link to="/blog" className="underline underline-offset-4 hover:text-foreground">
          guides hub
        </Link>
        .
      </GuideP>
    </GuideLayout>
  );
}
