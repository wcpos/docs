<!-- page-scores run: doc=settings/wp-admin/store-tax-ids climb=settings__wp-admin__store-tax-ids round=14 judge=opus-b -->
| Category | Store Tax IDs (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7.5 | 8.5 | 9 | 8 | 6 | 7.5 |
| Language | 6.5 | 6 | 7.5 | 8 | 8 | 6.5 | 7.5 |
| Visuals | 7 | 7 | 9 | 9 | 9 | 3 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 8 | 9.5 | 9.5 | 9.5 | 4 | 4.5 |
| Accuracy signals | 8.5 | 8.5 | 8.5 | 8.5 | 8.5 | 8 | 8 |
| **Average** | **7.71** | **7.50** | **8.57** | **8.79** | **8.57** | **6.00** | **6.29** |

1. **Add a tax number (screenshot) · Visuals.** The markers on the screenshot don't run left to right. The columns are Type, Value, Country, Custom label, but they carry 2, **4**, **3**, 5, so the eye jumps back and forth between the picture and the legend. On a phone it's worse: the markers cover the column headings, which read "TYP", "VALU" and "COUNTR". The store Tax screenshot further down already numbers Type, then Value, then Country in reading order. **Smallest fix:** in this shot, mark Value as 3 and Country as 4, swap those two legend entries, and move the markers just off the header text.

2. **Top of the page through step 1 · Structure / Language.** The path to the list appears three times before the first step ends: the code-styled "WP admin: WP Admin → POS → …" line, the intro's second sentence, and step 1. None of the approved pages repeat a path like this. The monospace arrow path is a developer style that no approved page uses. **Smallest fix:** delete the intro sentence "The list is in WP Admin → POS → Settings → General, under Store details, in Store tax IDs." Step 1 already says it.

3. **Set the numbers for one store (Pro), step 4 · Task clarity.** This one step holds five things: which fields to fill, the Type/Country rule, when a new row saves, how a row that's already saved saves differently, and the Saving…/✓ Saved message. The General list's steps split exactly this into steps 3–6, so this is the one place a cashier has to read twice. **Smallest fix:** split it in the same way: "4. Check Type, type the number in Value, and click outside the box. The corner says Saving…, then ✓ Saved." "5. If you want different wording, fill in Label (optional)." Then move the sentence about saved rows saving as soon as you pick to the end of step 5.
