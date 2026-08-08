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

const META = guide("/property-description-examples");

const FAQS = [
  {
    q: "How long should a UK property description be?",
    a: "Most portal listings read well between 180 and 350 words. Long enough to cover the property, the accommodation, outside space and location; short enough that a buyer scanning on a phone reaches the end.",
  },
  {
    q: "Should the description repeat the key features bullets?",
    a: "No. Bullets carry the quick facts — tenure, bedrooms, parking, EPC. The description should add context the bullets cannot: how rooms connect, where light falls, what the street and surrounding area are like.",
  },
  {
    q: "Can I say a property has period features?",
    a: "Only when the property notes support it. If you have not confirmed the age of the building or seen original cornicing, sash windows or fireplaces, describe what you did see instead of implying heritage you cannot evidence.",
  },
  {
    q: "What about Material Information?",
    a: "Tenure, council tax band, EPC rating, service charges and ground rent where relevant belong in the listing as facts, not adjectives. Keep them accurate and consistent with the description.",
  },
];

export const Route = createFileRoute("/property-description-examples")({
  head: () => guideHead(META, FAQS),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      meta={META}
      standfirst="A strong UK property description does three jobs: it tells the buyer what the property is, it explains how the space works day to day, and it gives them a reason to book a viewing. Below are four full worked examples — a city flat, a Victorian terrace, a family semi and a rural cottage — each annotated so you can see which sentence is doing the selling."
    >
      <GuideH2 id="what-good-looks-like">What a good description does differently</GuideH2>
      <GuideP>
        Weak listings describe adjectives. Strong listings describe decisions a buyer has to make:
        where they will cook, where the children will sleep, whether the car has somewhere to go,
        how far the station is. The examples below follow the same four-part shape used by most
        experienced UK agents.
      </GuideP>
      <GuideList
        items={[
          "Opening line — property type, headline benefit, location. One sentence, no throat-clearing.",
          "The accommodation — a walk through the layout in the order a buyer would experience it.",
          "Outside space and parking — garden aspect and size, garage, driveway, permit zone.",
          "Location and practicalities — schools, transport, high street, then tenure and EPC facts.",
        ]}
      />
      <GuideP>
        Notice what is absent: “nestled”, “boasts”, “must be viewed to be appreciated”. They cost
        you words and add nothing a buyer can act on.
      </GuideP>

      <GuideH2 id="flat">Example 1 — Two-bedroom city apartment</GuideH2>
      <GuideExample title="Description">
        <p>
          A two-bedroom third-floor apartment in a modern development a seven-minute walk from the
          city centre, with a south-facing balcony and secure allocated parking.
        </p>
        <p>
          The entrance hall opens into a 24ft open-plan living and dining room, with the kitchen set
          along one wall and integrated appliances including a dishwasher. Full-height glazing runs
          the length of the room and opens onto the balcony, which holds a table for two and catches
          sun from mid-morning. The principal bedroom has fitted wardrobes and an en-suite shower
          room; the second bedroom currently works as a home office with space for a double bed.
          There is a separate bathroom with a bath and shower over.
        </p>
        <p>
          The building has a video entry system, lift access to all floors and one allocated parking
          space in the gated undercroft. Leasehold with 118 years remaining, service charge £1,480
          per year, ground rent £250 per year. Council tax band C. EPC rating B.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "The first sentence answers type, benefit and location before the buyer decides to scroll on.",
          "Measurements and aspect (“south-facing”, “24ft”) do more than “spacious” or “bright”.",
          "The second bedroom is described honestly as an office that would take a double bed — no overclaiming, but the potential is stated.",
          "Leasehold facts sit at the end where they belong: visible, unglamorous and accurate.",
        ]}
      />

      <GuideH2 id="terrace">Example 2 — Victorian mid-terrace</GuideH2>
      <GuideExample title="Description">
        <p>
          A three-bedroom mid-terrace house on a quiet residential street, extended to the rear to
          create a 19ft kitchen-diner opening onto a west-facing garden.
        </p>
        <p>
          The front door opens into a hallway with the original tiled floor. To the left, the front
          reception room has a bay window and a working fireplace with a cast-iron surround. The
          hallway leads through to the rear extension, where the kitchen-diner runs the width of the
          house with bifold doors to the garden and space for a six-seat table. A utility cupboard
          off the kitchen houses the washing machine and the combination boiler, replaced in 2022.
        </p>
        <p>
          Upstairs there are two double bedrooms and a single, plus a family bathroom with a
          freestanding bath and separate shower enclosure. The loft is boarded with a fixed ladder
          and has standing height at the ridge, subject to the usual consents if a conversion were
          considered.
        </p>
        <p>
          The garden is approximately 40ft, laid mainly to lawn with a paved terrace directly off the
          kitchen and a brick-built shed at the rear. On-street parking is unrestricted. Freehold.
          Council tax band D. EPC rating D.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "Period detail is specific and verifiable — a tiled hall floor, a cast-iron surround — rather than a vague claim of “period charm”.",
          "The loft is presented as potential with a consent caveat, which protects you and still plants the idea.",
          "The boiler replacement date is the kind of concrete reassurance buyers remember at second viewing.",
          "Parking is stated plainly. If it were a permit zone, that would be said here too.",
        ]}
      />

      <GuideH2 id="semi">Example 3 — Family semi-detached</GuideH2>
      <GuideExample title="Description">
        <p>
          A four-bedroom semi-detached house within the catchment of two primary schools, with a
          driveway for two cars, a garage and a garden of approximately 60ft.
        </p>
        <p>
          The ground floor has been reworked for family life: an entrance porch and hall with a
          cloakroom and WC, a front sitting room, and an open-plan kitchen and family room across
          the back of the house with a large island, a pantry cupboard and doors to the garden. There
          is a separate study off the hall, useful for two people working from home.
        </p>
        <p>
          On the first floor the principal bedroom has an en-suite shower room and fitted wardrobes
          across one wall. Two further double bedrooms overlook the garden, and the fourth bedroom
          takes a single bed and a desk. The family bathroom has a bath with a shower over.
        </p>
        <p>
          Outside, the driveway takes two cars in front of a single garage with power and light. The
          rear garden is level, mainly lawn with mature borders, a paved terrace and a summer house
          at the far end. The high street and railway station are both around a fifteen-minute walk.
          Freehold. Council tax band E. EPC rating C.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "It leads with what this buyer group actually searches for: bedrooms, schools, parking, garden.",
          "“Useful for two people working from home” explains a room's value without inventing a fact.",
          "Distances are given in walking minutes, which reads more usefully than a fraction of a mile.",
          "Catchment claims should be checked against the current admissions policy before publishing.",
        ]}
      />

      <GuideH2 id="cottage">Example 4 — Rural cottage</GuideH2>
      <GuideExample title="Description">
        <p>
          A detached two-bedroom stone cottage on the edge of the village, with a walled garden,
          off-road parking for two cars and open countryside beyond the rear boundary.
        </p>
        <p>
          A stable door opens into a flagstone hallway. The sitting room has exposed ceiling beams
          and a wood-burning stove set into an inglenook fireplace, with a window seat under a deep
          sill. The kitchen has a range cooker, a butler sink and space for a small table; a rear
          lobby beyond it provides boot storage and access to the garden.
        </p>
        <p>
          Both bedrooms are on the first floor, the larger with a view across the fields. The
          bathroom has a roll-top bath and a separate shower. Heating is by oil-fired boiler with
          the tank sited at the side of the property; drainage is to a private septic tank.
        </p>
        <p>
          The garden is enclosed by a stone wall, with a lawn, gravelled seating area and a
          timber-framed store. A gate at the rear leads onto a public footpath. The village has a
          shop, pub and primary school; the nearest market town is six miles. Freehold. Council tax
          band D. EPC rating F.
        </p>
      </GuideExample>
      <GuideH3>Why it works</GuideH3>
      <GuideList
        items={[
          "Rural buyers need practical answers early: heating type, drainage, parking, distance to a town.",
          "A low EPC and a septic tank are stated rather than buried, which saves wasted viewings.",
          "The footpath at the rear is disclosed; buyers find these things anyway, and late surprises cost deals.",
          "Beams, stove and inglenook are described because they were seen — not because the property is old.",
        ]}
      />

      <GuideH2 id="mistakes">Five habits that weaken UK listing copy</GuideH2>
      <GuideList
        items={[
          "Opening with the agency rather than the property. The buyer is shopping for a home, not a brand.",
          "Stacking adjectives — “stunning, immaculate, beautifully presented” — where one measurement would be stronger.",
          "Describing rooms out of order, so the reader cannot build a mental floorplan.",
          "Hiding the compromise. Every property has one; naming it filters the viewing list in your favour.",
          "Copying the bullets into the prose, which doubles the length and halves the information.",
        ]}
      />

      <GuideH2 id="faqs">FAQs</GuideH2>
      <GuideFaqs faqs={FAQS} />

      <GuideCta meta={META} label="Write descriptions like these from your own notes" />

      <GuideP>
        Working on a template instead of a finished example? See the{" "}
        <Link
          to="/rightmove-property-description-template"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Rightmove-style description template and checklist
        </Link>
        , or browse the full{" "}
        <Link to="/blog" className="underline underline-offset-4 hover:text-foreground">
          guides hub
        </Link>
        .
      </GuideP>
    </GuideLayout>
  );
}
