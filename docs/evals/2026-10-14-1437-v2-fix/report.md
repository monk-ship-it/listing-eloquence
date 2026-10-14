# Prompt eval — v2-fix

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `2ca206187d88`
- Git sha: `6b7dd85`
- Cases × runs: 11 × 1
- LLM grader: on
- Tokens: 119,972 in / 26,833 out
- Started: 2026-10-14T14:37:01.170Z
- Result: **2/11 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| C1-leasehold-missing-ground-rent | FAIL | 4 | 1 | 8.4 | 18.4 | – | 0 | PASS 4.88 |
| C4-knotweed | PASS | 0 | 0 | 8.1 | 19.8 | – | 0 | PASS 5.00 |
| C5-modern-method-of-auction-legacy | FAIL | 1 | 2 | 8.4 | 42.0 | – | 1 | PASS 5.00 |
| C6-voice-note-conflicts-and-private-leak | FAIL | 2 | 0 | 7.5 | 18.2 | – | 0 | FAIL 3.88 |
| A7-lordswood-planning-conflict | PASS | 0 | 0 | 11.8 | 22.2 | – | 0 | FAIL 3.75 |
| A2-flat-over-shop-streatham-professional | FAIL | 2 | 2 | 11.2 | 30.2 | – | 0 | PASS 5.00 |
| A3-1930s-semi-sevenoaks-premium | FAIL | 5 | 0 | 15.5 | 26.6 | – | 0 | PASS 5.00 |
| A4-country-house-frant-luxury | FAIL | 3 | 0 | 11.6 | 28.5 | – | 0 | PASS 5.00 |
| A5-victorian-cottage-smarden-heritage | FAIL | 3 | 0 | 10.4 | 23.2 | – | 0 | PASS 5.00 |
| A6-new-build-kings-hill-professional | FAIL | 6 | 2 | 10.0 | 22.8 | – | 0 | PASS 4.38 |
| A6-new-build-kings-hill-professional-legacy | FAIL | 6 | 2 | 12.7 | 29.8 | – | 0 | PASS 5.00 |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 3 | banned: Banned phrase "…" in listing | C1-leasehold-missing-ground-rent, C6-voice-note-conflicts-and-private-leak, A6-new-build-kings-hill-professional |
| 3 | raw:banned: Banned phrase "…" in listing | C1-leasehold-missing-ground-rent, C6-voice-note-conflicts-and-private-leak, A6-new-build-kings-hill-professional |
| 3 | raw:limits: Email body doesn't end with the material-information line | A2-flat-over-shop-streatham-professional, A3-1930s-semi-sevenoaks-premium, A4-country-house-frant-luxury |
| 2 | v2: emailBlast.body: no "…" sentence | C5-modern-method-of-auction-legacy, A3-1930s-semi-sevenoaks-premium |
| 2 | mustInclude: "…" missing from listing | A3-1930s-semi-sevenoaks-premium, A6-new-build-kings-hill-professional-legacy |
| 2 | limits: Seller email N words (need N–N) | A4-country-house-frant-luxury, A5-victorian-cottage-smarden-heritage |
| 2 | raw:limits: Seller email N words (need N–N) | A4-country-house-frant-luxury, A5-victorian-cottage-smarden-heritage |
| 2 | v2: social.X: missing image label (N triggered) | A6-new-build-kings-hill-professional, A6-new-build-kings-hill-professional-legacy |
| 1 | banned: Banned phrase "…" in social.Instagram | C1-leasehold-missing-ground-rent |
| 1 | raw:banned: Banned phrase "…" in social.Instagram | C1-leasehold-missing-ground-rent |

## Details

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…d one bathroom. The flat is on the first floor and benefits from lift access.  Outside, there is one allocated pa…`
- FAIL `banned` Banned phrase "book your viewing today" in social.Instagram — `…ax Band B  Full material information on the listing. Book your viewing today 🔑 Chatham ChathamProperty Medway Kent NewInst…`
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…d one bathroom. The flat is on the first floor and benefits from lift access.  Outside, there is one allocated pa…`
- FAIL `raw:banned` Banned phrase "book your viewing today" in social.Instagram — `…ax Band B  Full material information on the listing. Book your viewing today 🔑 Chatham ChathamProperty Medway Kent NewInst…`
- 1 warning(s): `factCheck` "I've" (name) in seller email is not in the inputs
- LLM: PASS (avg 4.88; 1:5 2:4 3:5 4:5 5:5 6:5 7:5 8:5)
  - Portal description: Add ground rent information from voice notes ('Ground rent approximately £300 per year') to the material information paragraph, as this is a leasehold cost that should be disclosed alongside service charge.
  - Seller approval email: Add ground rent question explicitly asking for confirmation of the £300 per year figure mentioned in voice notes, not just asking them to provide it from scratch.

### C4-knotweed — PASS

- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction-legacy — FAIL

- FAIL `v2` emailBlast.body: no "Please note:" sentence
- 2 warning(s): `factCheck` "Isle" (name) in description is not in the inputs; `factCheck` "Sheppey" (name) in description is not in the inputs
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C6-voice-note-conflicts-and-private-leak — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…age.  The house provides three reception rooms and benefits from oil-fired central heating. An indoor swimming po…`
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…age.  The house provides three reception rooms and benefits from oil-fired central heating. An indoor swimming po…`
- LLM: FAIL (avg 3.88; 1:2 2:4 3:5 4:5 5:5 6:4 7:4 8:2)
  - FACTS state 4 bedrooms, voice notes say 'Five-bed' – resolve this critical discrepancy before publication
  - FACTS state 2.1-acre plot, voice notes say 'about three acres' – verify actual plot size
  - FACTS state asking price £1,250,000, voice notes say 'guide one point three million' – confirm correct guide price
  - FACTS state EPC rating D, voice notes say 'EPC C now the windows are done' – verify current EPC rating
  - Voice notes mention 'Stunning views to London' which is a key selling feature but omitted from all copy – add if verifiable
  - Voice notes mention 'Owners are divorcing and want a quick sale, would take one point one five' – this is sensitive information that must not appear (correctly omitted)
  - Seller approval email asks about 4 bedrooms when voice notes say 5 – this inconsistency will undermine seller confidence
  - All outputs use 2.1 acres but voice notes say 'about three acres' – material 30% discrepancy needs resolution

### A7-lordswood-planning-conflict — PASS

- LLM: FAIL (avg 3.75; 1:2 2:3 3:5 4:4 5:5 6:5 7:4 8:2)
  - Change 'repaired August 2026' to 'repaired August 2024' throughout all outputs (portal description, email blast, seller email, social posts) – the repair date is in the future and factually impossible
  - Remove 'Lean-to utility (no known planning or building regulations approval)' from key features – known issues must not appear in key features, only in material information section
  - Add the full material information block to the portal description – currently missing building safety, restrictions, flooding, coastal erosion, accessibility, and coalfield/mining disclosures
  - Seller approval email question 17: change 'repaired August 2026' to 'repaired August 2024'
  - Seller approval email question 18: change wording to match facts exactly – 'Seller unaware of planning or building regulations approval for the lean-to utility'
  - Instagram post: change 'repaired August 2026' to 'repaired August 2024'
  - Facebook post: change 'repaired August 2026' to 'repaired August 2024'
  - Portal description: add missing material information items (building safety, restrictions, flooding, coastal erosion, accessibility, coalfield/mining) before the known issues

### A2-flat-over-shop-streatham-professional — FAIL

- FAIL `raw:limits` Key feature ends with a full stop — `Leasehold: 89 years remaining, ground rent £350 p.a., service charge £960 p.a.`
- FAIL `raw:limits` Email body doesn't end with the material-information line — `rcial unit, and there is a shared bin store. Full material information is on the property listing.  A chain is involved.`
- 2 warning(s): `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A3-1930s-semi-sevenoaks-premium — FAIL

- FAIL `mustInclude` "completion certificate" missing from listing
- FAIL `v2` emailBlast.body: no "Please note:" sentence
- FAIL `v2` social.Instagram: no "Please note:" sentence
- FAIL `v2` social.Facebook: no "Please note:" sentence
- FAIL `raw:limits` Email body doesn't end with the material-information line — `and F (Sevenoaks District Council). EPC rating: D. Full material information is on the property listing.  Book a viewing`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — FAIL

- FAIL `limits` Seller email 279 words (need 150–250)
- FAIL `raw:limits` Email body doesn't end with the material-information line — ` tax banding of the annexe has not been confirmed. Full material information is on the property listing.  Book a viewing`
- FAIL `raw:limits` Seller email 279 words (need 150–250)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A5-victorian-cottage-smarden-heritage — FAIL

- FAIL `limits` Seller email 279 words (need 150–250)
- FAIL `raw:limits` Email Blast missing
- FAIL `raw:limits` Seller email 279 words (need 150–250)
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A6-new-build-kings-hill-professional — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…ith completion expected spring 2027. The property benefits from an air source heat pump, underfloor heating to th…`
- FAIL `privateLeak` Private-note wording "exterior" in description — `exterior`
- FAIL `privateLeak` Private-note wording "image" in description — `image`
- FAIL `privateLeak` Private-note wording "exterior image is" in description — `exterior image is`
- FAIL `v2` social.X: missing image label (2 triggered)
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…ith completion expected spring 2027. The property benefits from an air source heat pump, underfloor heating to th…`
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 4.38; 1:4 2:4 3:3 4:5 5:5 6:5 7:4 8:5)
  - Voice notes say 'Only three Larches left, push that' – this scarcity/pressure language must not appear anywhere. Check all outputs are clean (they are).
  - Portal description: 'Images show the show home; specification may differ. Exterior image is computer-generated (CGI) and indicative only.' – this is from PRIVATE NOTES and should not appear. Remove or rephrase without referencing show home Plot 12.
  - Social Instagram: 'Images show the show home; specification may differ.' – remove this line as it references private viewing notes.
  - Social Facebook: 'Images show the show home; specification may differ.' – remove this line as it references private viewing notes.
  - Headline: 'Three-bedroom new-build semi in Kings Hill, spring 2027' – consider leading with 'The Larch' or 'Air source heat pump' for stronger differentiation.
  - Portal description: Consider moving the material information block (price, reservation fee, etc.) to immediately after the first paragraph for better disclosure prominence.
  - Email subject lines: All three are strong but consider one that highlights the £5k flooring incentive as it's time-limited and material.
  - Seller email: 'How is the mobile signal at the property, indoors and outdoors?' – this question is appropriate but consider whether mobile signal data should already be in material information if known.

### A6-new-build-kings-hill-professional-legacy — FAIL

- FAIL `mustInclude` "show home" missing from listing
- FAIL `mustInclude` "CGI" missing from listing
- FAIL `v2` listing: missing image label (2 triggered)
- FAIL `v2` social.Instagram: missing image label (2 triggered)
- FAIL `v2` social.Facebook: missing image label (2 triggered)
- FAIL `v2` social.X: missing image label (2 triggered)
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)
