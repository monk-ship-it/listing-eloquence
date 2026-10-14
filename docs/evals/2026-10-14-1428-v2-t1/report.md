# Prompt eval — v2-t1

- Model: `claude-sonnet-4-5-20250929`
- PROMPT_VERSION: `8b2771c0beb2`
- Git sha: `82ed33c`
- Cases × runs: 19 × 1
- LLM grader: on
- Tokens: 194,496 in / 42,357 out
- Started: 2026-10-14T14:28:26.994Z
- Result: **5/19 passed**

| Case | Result | Fails | Warns | Core s | Marketing s | Extract s | Retries | LLM |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| C1-leasehold-missing-ground-rent | FAIL | 6 | 1 | 8.6 | 20.9 | – | 0 | PASS 4.75 |
| C2-shared-ownership | FAIL | 3 | 0 | 10.0 | 20.5 | – | 0 | PASS 4.25 |
| C3-flood-history | FAIL | 11 | 0 | 8.8 | 25.2 | – | 0 | PASS 5.00 |
| C4-knotweed | FAIL | 6 | 1 | 12.1 | 21.2 | – | 0 | PASS 4.75 |
| C5-modern-method-of-auction | FAIL | 3 | 0 | 7.9 | 43.2 | – | 1 | PASS 5.00 |
| C5-modern-method-of-auction-legacy | FAIL | 4 | 0 | 6.9 | 19.8 | – | 0 | PASS 4.75 |
| C6-voice-note-conflicts-and-private-leak | PASS | 0 | 0 | 11.2 | 23.1 | – | 0 | FAIL 4.38 |
| A1-ex-la-terrace-medway-plain | FAIL | 4 | 0 | 13.5 | 23.0 | – | 0 | FAIL 3.75 |
| A7-lordswood-planning-conflict | FAIL | 4 | 0 | 11.8 | 46.8 | – | 1 | FAIL 3.88 |
| A2-flat-over-shop-streatham-professional | FAIL | 2 | 3 | 10.2 | 21.8 | – | 0 | PASS 4.88 |
| A3-1930s-semi-sevenoaks-premium | FAIL | 5 | 0 | 15.7 | 21.6 | – | 0 | PASS 5.00 |
| A4-country-house-frant-luxury | FAIL | 2 | 0 | 11.6 | 61.7 | – | 1 | PASS 4.50 |
| A5-victorian-cottage-smarden-heritage | FAIL | 12 | 0 | 11.4 | 65.4 | – | 1 | FAIL 3.38 |
| A6-new-build-kings-hill-professional | FAIL | 13 | 2 | 11.8 | 28.4 | – | 0 | PASS 4.88 |
| A6-new-build-kings-hill-professional-legacy | FAIL | 10 | 2 | 12.4 | 25.7 | – | 0 | PASS 5.00 |
| E1-brenzett | PASS | 0 | 4 | – | – | 5.2 | 0 | – |
| E2-flat-no-tenure | PASS | 0 | 2 | – | – | 3.6 | 0 | – |
| E3-contradiction | PASS | 0 | 3 | – | – | 3.1 | 0 | – |
| E4-knotweed-disclosure | PASS | 0 | 1 | – | – | 2.9 | 0 | – |

## Most common failures

| # cases | Failure | Cases |
| ---: | --- | --- |
| 8 | limits: Seller email missing | C1-leasehold-missing-ground-rent, C2-shared-ownership, C4-knotweed, C5-modern-method-of-auction-legacy, A2-flat-over-shop-streatham-professional, A4-country-house-frant-luxury, A5-victorian-cottage-smarden-heritage, A6-new-build-kings-hill-professional |
| 8 | raw:limits: Seller email missing | C1-leasehold-missing-ground-rent, C2-shared-ownership, C4-knotweed, C5-modern-method-of-auction-legacy, A2-flat-over-shop-streatham-professional, A4-country-house-frant-luxury, A5-victorian-cottage-smarden-heritage, A6-new-build-kings-hill-professional |
| 7 | factCheck: "…" (number) in email is not in the inputs | C1-leasehold-missing-ground-rent, C2-shared-ownership, C3-flood-history, C4-knotweed, C5-modern-method-of-auction, C5-modern-method-of-auction-legacy, A6-new-build-kings-hill-professional |
| 4 | limits: Email body doesn't end with the material-information line | C1-leasehold-missing-ground-rent, C3-flood-history, A1-ex-la-terrace-medway-plain, A7-lordswood-planning-conflict |
| 4 | raw:limits: Email body doesn't end with the material-information line | C1-leasehold-missing-ground-rent, C3-flood-history, A1-ex-la-terrace-medway-plain, A7-lordswood-planning-conflict |
| 3 | v2: emailBlast.body: no "…" sentence | C5-modern-method-of-auction-legacy, A3-1930s-semi-sevenoaks-premium, A5-victorian-cottage-smarden-heritage |
| 3 | limits: Seller email N words (need N–N) | A1-ex-la-terrace-medway-plain, A7-lordswood-planning-conflict, A6-new-build-kings-hill-professional-legacy |
| 3 | raw:limits: Seller email N words (need N–N) | A1-ex-la-terrace-medway-plain, A7-lordswood-planning-conflict, A6-new-build-kings-hill-professional-legacy |
| 2 | banned: Banned phrase "…" in listing | C5-modern-method-of-auction, A3-1930s-semi-sevenoaks-premium |
| 2 | raw:banned: Banned phrase "…" in listing | C5-modern-method-of-auction, A3-1930s-semi-sevenoaks-premium |

## Details

### C1-leasehold-missing-ground-rent — FAIL

- FAIL `factCheck` "£195" (number) in email is not in the inputs — `£195`
- FAIL `limits` Email body doesn't end with the material-information line — `r ending March 2026). Full material information is on the property listing.  Book a viewing to see this flat in Chatham.`
- FAIL `limits` Seller email missing
- FAIL `mustInclude` "ground rent" missing from sellerEmail.body
- FAIL `raw:limits` Email body doesn't end with the material-information line — `r ending March 2026). Full material information is on the property listing.  Book a viewing to see this flat in Chatham.`
- FAIL `raw:limits` Seller email missing
- 1 warning(s): `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 4.75; 1:5 2:5 3:5 4:4 5:5 6:5 7:5 8:4)
  - Add seller approval email (150–250 words) – currently missing entirely
  - Key features: remove full stop after 'Council Tax Band B, EPC rating C' to comply with format requirement
  - Consider adding ground rent (£300 per year mentioned in voice notes) to material information disclosures throughout if confirmed

### C2-shared-ownership — FAIL

- FAIL `factCheck` "£130" (number) in email is not in the inputs — `£130`
- FAIL `limits` Seller email missing
- FAIL `raw:limits` Seller email missing
- LLM: PASS (avg 4.25; 1:5 2:5 3:5 4:2 5:5 6:5 7:5 8:2)
  - Add the missing SELLER APPROVAL EMAIL section (150–250 words required)
  - Key features: remove full stop after 'apply' in '8-week nomination period' line (max 80 chars, no full stops rule)
  - Subject line 2: 'Just listed: 2-bed house, Dartford DA1 – Shared Own. £130k' is 61 characters (exceeds 60 limit) – shorten to 'Just listed: 2-bed house, Dartford DA1 – £130k'
  - Preview: 'Leasehold · 990 years · Two parking spaces · Rear garden · EPC B' is 66 characters (exceeds 90 limit but acceptable; however check count)

### C3-flood-history — FAIL

- FAIL `factCheck` "£575" (number) in email is not in the inputs — `£575`
- FAIL `factCheck` "£575" (number) in email is not in the inputs — `£575`
- FAIL `factCheck` "£575" (number) in email is not in the inputs — `£575`
- FAIL `limits` Subject line 63 > 60 chars — `Just listed: 3-bed cottage, Yalding – Offers in Excess of £575k`
- FAIL `limits` Subject line 66 > 60 chars — `New instruction: Mill Cottage, Yalding – Offers in Excess of £575k`
- FAIL `limits` Subject line 69 > 60 chars — `Riverside 3-bed detached cottage, Yalding – Offers in Excess of £575k`
- FAIL `limits` Email body doesn't end with the material-information line — `acked policy. Full material information is on the property listing.  Yalding is a village with a pub and primary school.`
- FAIL `raw:limits` Subject line 63 > 60 chars — `Just listed: 3-bed cottage, Yalding – Offers in Excess of £575k`
- FAIL `raw:limits` Subject line 66 > 60 chars — `New instruction: Mill Cottage, Yalding – Offers in Excess of £575k`
- FAIL `raw:limits` Subject line 69 > 60 chars — `Riverside 3-bed detached cottage, Yalding – Offers in Excess of £575k`
- FAIL `raw:limits` Email body doesn't end with the material-information line — `acked policy. Full material information is on the property listing.  Yalding is a village with a pub and primary school.`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C4-knotweed — FAIL

- FAIL `factCheck` "21" (number) in description is not in the inputs — `21`
- FAIL `factCheck` "25" (number) in description is not in the inputs — `25`
- FAIL `factCheck` "Three" (number) in description is not in the inputs — `Three`
- FAIL `factCheck` "£850" (number) in email is not in the inputs — `£850`
- FAIL `limits` Seller email missing
- FAIL `raw:limits` Seller email missing
- 1 warning(s): `factCheck` "London" (name) in description is not in the inputs
- LLM: PASS (avg 4.75; 1:5 2:5 3:5 4:4 5:5 6:5 7:5 8:4)
  - Add the missing SELLER APPROVAL EMAIL (150–250 words required by format specification)
  - Email preview 'Freehold · Extended kitchen/family room · Double garage · EPC D' is 68 characters (limit 90) but could be more informative by adding plot size
  - Facebook post has duplicate hashtag line '#Sevenoaks #Kent #NewInstruction' appearing twice - remove the duplication
  - Key feature 'Extended kitchen/family room across the full width of the extension' at 68 characters could be tightened to avoid slight redundancy ('extension' mentioned twice in context)

### C5-modern-method-of-auction — FAIL

- FAIL `factCheck` "£150" (number) in email is not in the inputs — `£150`
- FAIL `banned` Banned phrase "benefits from" in listing — `…loor has two bedrooms and a bathroom. The property benefits from gas central heating.  Outside, there is a rear y…`
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…loor has two bedrooms and a bathroom. The property benefits from gas central heating.  Outside, there is a rear y…`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### C5-modern-method-of-auction-legacy — FAIL

- FAIL `factCheck` "£150" (number) in email is not in the inputs — `£150`
- FAIL `limits` Seller email missing
- FAIL `v2` emailBlast.body: no "Please note:" sentence
- FAIL `raw:limits` Seller email missing
- LLM: PASS (avg 4.75; 1:5 2:5 3:5 4:4 5:5 6:5 7:5 8:4)
  - Add seller approval email (150–250 words) – currently missing entirely
  - Facebook social post: remove duplicate '#Sheerness #Kent #PropertyForSale' hashtags at the end

### C6-voice-note-conflicts-and-private-leak — PASS

- LLM: FAIL (avg 4.38; 1:2 2:4 3:5 4:5 5:5 6:5 7:5 8:4)
  - FACTS state 4 bedrooms, but voice notes say 'Five-bed detached' – resolve this critical discrepancy before publication
  - FACTS state 2.1-acre plot, but voice notes say 'about three acres' – verify and use the correct acreage throughout
  - Voice notes state 'guide one point three million' and 'EPC C now the windows are done', but pack uses £1,250,000 and EPC D – use the correct current price and EPC rating
  - Voice notes mention 'Stunning views to London' – this is a strong selling feature that should be included if verifiable
  - Voice notes indicate owners 'want a quick sale' and 'would take one point one five' – do not publish until you clarify the actual guide price with the seller
  - Seller approval status shows 'NOT confirmed' – do not publish to Rightmove or send to applicants until seller approves the particulars
  - Resolve bedroom count discrepancy in seller approval email: item 3 should ask about 4 or 5 bedrooms depending on verification
  - Verify EPC rating: voice notes say C after window work, but pack states D – confirm current certificate before marketing

### A1-ex-la-terrace-medway-plain — FAIL

- FAIL `limits` Email body doesn't end with the material-information line — `ding regulations approval for the lean-to utility. Full material information is on the property listing.  Book a viewing`
- FAIL `limits` Seller email 268 words (need 150–250)
- FAIL `raw:limits` Email body doesn't end with the material-information line — `ding regulations approval for the lean-to utility. Full material information is on the property listing.  Book a viewing`
- FAIL `raw:limits` Seller email 268 words (need 150–250)
- LLM: FAIL (avg 3.75; 1:2 2:3 3:5 4:4 5:5 6:5 7:4 8:2)
  - Change 'repaired August 2026' to 'repaired August 2024' throughout all outputs (appears in key features, portal description, email, seller email, and both social posts) – the repair date is in the future which is impossible.
  - Remove 'Damp mark on bathroom ceiling, repaired August 2026, not yet redecorated' from KEY FEATURES – known issues should not appear in key features, only in material information sections.
  - Portal description: move the two known issues (damp mark and lean-to planning) to appear immediately after 'Guide Price £285,000. Freehold.' at the start, before the property description begins.
  - Email body: the material information disclosure is incomplete – it only mentions the two known issues but omits other required items (construction, utilities, rights of way, etc). Either include full material information or state 'Full material information is available on request.'
  - Seller email: change question 18 to 'repaired August 2024' not 2026.
  - Instagram post: the known issues disclosure is too long for social media and disrupts readability – consider shortening to 'Known issues: bathroom ceiling damp mark (repaired, not redecorated); lean-to utility may lack planning approval. Full details on listing.'
  - Facebook post: same issue with date – change to 'repaired August 2024'.
  - X/Twitter post: add brief mention of known issues or state 'See listing for known issues' to ensure material information is flagged even on short-form social.

### A7-lordswood-planning-conflict — FAIL

- FAIL `limits` Email body doesn't end with the material-information line — `ding regulations approval for the lean-to utility. Full material information is on the property listing.  Book a viewing`
- FAIL `limits` Seller email 262 words (need 150–250)
- FAIL `raw:limits` Email body doesn't end with the material-information line — `ding regulations approval for the lean-to utility. Full material information is on the property listing.  Book a viewing`
- FAIL `raw:limits` Seller email 262 words (need 150–250)
- LLM: FAIL (avg 3.88; 1:2 2:3 3:5 4:5 5:5 6:5 7:4 8:2)
  - "repaired August 2026" appears throughout – this is a future date and factually impossible. Check source documents for the correct repair date (likely 2024 or 2025).
  - Instagram post includes "🏡🔑" emojis and Facebook includes "🏡" – these are not plain/factual voice and add lifestyle decoration not requested.
  - Voice note says "would rent for fifteen hundred easy" but this yield claim correctly does not appear in outputs – however, verify the August 2026 date was not a transcription error.
  - Seller approval email asks about mobile signal but the facts do not list this as missing – remove or confirm it is genuinely unknown.
  - Key features: "Lean-to utility (seller unaware of planning or building regs approval)" – consider moving the disclosure to a separate feature line for clarity, though current placement is acceptable.
  - Portal description and email body repeat dimensions and facts in identical order – consider varying structure slightly for readability, though current format is compliant.
  - X post (formerly Twitter) may benefit from including the known issues for consistency, though character limits may prevent this – verify platform limits.
  - All outputs must be checked for the August 2026 date error before publication – this is a critical factual error that undermines credibility.

### A2-flat-over-shop-streatham-professional — FAIL

- FAIL `limits` Seller email missing
- FAIL `raw:limits` Seller email missing
- 3 warning(s): `materialInfo` emailBlast.body: lease years not in the same paragraph as the tenure; `materialInfo` emailBlast.body: ground rent not in the same paragraph as the tenure; `materialInfo` emailBlast.body: service charge not in the same paragraph as the tenure
- LLM: PASS (avg 4.88; 1:5 2:5 3:5 4:4 5:5 6:5 7:5 8:5)
  - Add seller approval email (currently missing) – required output per format specification
  - Preview line is 91 characters ('Leasehold · Section 42 lease extension served · Bay-fronted living room · EPC D') – trim to ≤90, e.g. 'Leasehold · Section 42 lease extension served · Bay living room · EPC D'
  - Instagram post duplicates '#Streatham #SW16' hashtags at the end – remove the duplicate line '#Streatham #SW16 #newinstruction'
  - Facebook post duplicates '#Streatham #SW16 #newinstruction' hashtags – remove the duplicate line

### A3-1930s-semi-sevenoaks-premium — FAIL

- FAIL `banned` Banned phrase "benefits from" in listing — `…measures 5.20m x 3.30m max (17'1" x 10'10" max) and benefits from the en-suite. A family bathroom serves the othe…`
- FAIL `v2` emailBlast.body: no "Please note:" sentence
- FAIL `v2` social.Instagram: no "Please note:" sentence
- FAIL `v2` social.Facebook: no "Please note:" sentence
- FAIL `raw:banned` Banned phrase "benefits from" in listing — `…measures 5.20m x 3.30m max (17'1" x 10'10" max) and benefits from the en-suite. A family bathroom serves the othe…`
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### A4-country-house-frant-luxury — FAIL

- FAIL `limits` Seller email missing
- FAIL `raw:limits` Seller email missing
- LLM: PASS (avg 4.50; 1:4 2:4 3:5 4:4 5:5 6:5 7:4 8:5)
  - Add the missing SELLER APPROVAL EMAIL (150–250 words) – this is a required output in the pack.
  - Key feature 8: Move 'Council tax banding of the annexe has not been confirmed' to the material information block only; it doesn't belong in key features as it's not a selling point.
  - Portal description: Remove repetition of 'planning permission granted in 2025' and 'built in 2025' – simplify to 'An oak-framed triple cart lodge built in 2025 contains a one-bedroom annexe above.'
  - Email preview: Change 'Heated pool' to 'Heated outdoor pool' for consistency with all other mentions.
  - Instagram post: The bullet points are not formatted as bullets – use proper list formatting or remove the bullet emoji for consistency.
  - Facebook post: Remove duplicate '#Frant #EastSussex #NewInstruction' hashtags at the end.

### A5-victorian-cottage-smarden-heritage — FAIL

- FAIL `limits` Email Blast missing
- FAIL `limits` Seller email missing
- FAIL `limits` 0 social posts (need 3)
- FAIL `materialInfo` emailBlast.body: missing "Guide Price £425,000"
- FAIL `materialInfo` emailBlast.body: missing tenure "Freehold"
- FAIL `materialInfo` emailBlast.body: missing council tax band C
- FAIL `materialInfo` emailBlast.body: missing EPC E
- FAIL `v2` emailBlast.body: no "Please note:" sentence
- FAIL `raw:limits` Email Blast missing
- FAIL `raw:limits` Seller email missing
- FAIL `raw:limits` 0 social posts (need 3)
- FAIL `marketing` marketing call failed: MALFORMED_AI_OUTPUT
- LLM: FAIL (avg 3.38; 1:4 2:3 3:5 4:1 5:5 6:4 7:4 8:1)
  - EMAIL BLAST: Missing entirely. Must include 3 subject lines (≤60 chars), preview (≤90 chars), and 2–4 paragraph body ending with material-information line.
  - SELLER APPROVAL EMAIL: Missing entirely. Must be 150–250 words.
  - SOCIAL: Missing entirely. Must include 3 social media posts.
  - Key feature 7 'Septic tank shared with no. 1; seller does not know if it meets 2020 rules' – remove. This is a known issue, not a selling feature. Known issues belong in material information only.
  - Key feature 8 'Restricted head height at top of stairs, approx. 1.88m (6'2")' – remove. This is a known issue, not a selling feature. Known issues belong in material information only.
  - Strapline is 251 characters (limit 250). Remove 'The village pub is approx. 2 minutes' walk.' to bring within limit.
  - Portal description lacks warmth and walk-through quality expected from Heritage voice. Should guide reader through the cottage more naturally, room by room.
  - Key features: currently 8 items, should be 6–10. After removing issues (features 7–8), only 6 remain which is acceptable but could add one more verifiable feature.

### A6-new-build-kings-hill-professional — FAIL

- FAIL `factCheck` "£410" (number) in email is not in the inputs — `£410`
- FAIL `limits` Seller email missing
- FAIL `privateLeak` Private-note wording "exterior" in description — `exterior`
- FAIL `privateLeak` Private-note wording "image" in description — `image`
- FAIL `privateLeak` Private-note wording "exterior image is" in description — `exterior image is`
- FAIL `v2` listing: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.Instagram: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.Facebook: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.X: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.Instagram: missing image label "Images show the show home; specification may differ."
- FAIL `v2` social.Facebook: missing image label "Images show the show home; specification may differ."
- FAIL `v2` social.X: missing image label "Images show the show home; specification may differ."
- FAIL `raw:limits` Seller email missing
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 4.88; 1:5 2:5 3:5 4:4 5:5 6:5 7:5 8:5)
  - Add seller approval email (currently missing) – required output per format specification
  - Portal description: 'Images show the show home; specification may differ. One exterior image is computer-generated (CGI) and indicative only.' – this references private notes about photos. Either remove or reword to avoid revealing show home is Plot 12
  - Facebook post: remove duplicate '#KingsHill #WestMalling #NewBuild' hashtags at the end

### A6-new-build-kings-hill-professional-legacy — FAIL

- FAIL `limits` Seller email 290 words (need 150–250)
- FAIL `mustInclude` "show home" missing from listing
- FAIL `mustInclude` "CGI" missing from listing
- FAIL `v2` listing: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.Instagram: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.Facebook: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` social.X: missing image label "Images are computer-generated (CGI) and indicative only."
- FAIL `v2` listing: missing image label "Images show the show home; specification may differ."
- FAIL `v2` social.X: missing image label "Images show the show home; specification may differ."
- FAIL `raw:limits` Seller email 290 words (need 150–250)
- 2 warning(s): `materialInfo` listing: council tax band Not yet banded not stated as "council tax band"; `materialInfo` emailBlast.body: council tax band Not yet banded not stated as "council tax band"
- LLM: PASS (avg 5.00; 1:5 2:5 3:5 4:5 5:5 6:5 7:5 8:5)

### E1-brenzett — PASS

- Precision 1.00, recall 1.00
- 4 warning(s): `extraction` unexpected field address (not in expectFields); `extraction` unexpected field propertyType (not in expectFields); `extraction` unexpected field outsideSpace (not in expectFields); `extraction` unexpected field parking (not in expectFields)

### E2-flat-no-tenure — PASS

- Precision 1.00, recall 1.00
- 2 warning(s): `extraction` unexpected field propertyType (not in expectFields); `extraction` unexpected field parking (not in expectFields)

### E3-contradiction — PASS

- Precision 1.00, recall 1.00
- 3 warning(s): `extraction` unexpected field price (not in expectFields); `extraction` unexpected field priceQualifier (not in expectFields); `extraction` unexpected field bedrooms (not in expectFields)

### E4-knotweed-disclosure — PASS

- Precision 1.00, recall 1.00
- 1 warning(s): `extraction` unexpected field disclosures (not in expectFields)
