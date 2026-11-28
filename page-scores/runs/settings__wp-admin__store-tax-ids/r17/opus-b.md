<!-- page-scores run: doc=settings/wp-admin/store-tax-ids climb=settings__wp-admin__store-tax-ids round=17 judge=opus-b -->
| Category | Store Tax IDs | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 7 | 7 | 9 | 9 | 9 | 5 | 4 |
| Structure | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 8 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.50** | **7.43** | **8.64** | **8.86** | **8.64** | **6.29** | **6.36** |

1. **Add a tax number: the first screenshot (Visuals).** The callout numbers don't follow the screen. Left to right the columns are Type ②, Value ④, Country ③, Custom label ⑤, so the eye jumps back and forth between the shot and the legend. It also clashes with steps 3–5, which go Type → Value → Custom label. The top of the crop is mostly an empty Refund & Returns Policy box, and on a phone (`page/page-phone-02.png`) the labels and field text are too small to read. **Smallest fix:** number the columns left to right (Type 2, Value 3, Country 4, Custom label 5, Remove 6), reorder the legend to match, and crop the shot to start at the "Store tax IDs" heading.

2. **What prints on the receipt (Visuals / Task clarity).** This section is about the result the cashier actually sees, but it has no picture of a receipt. The approved pages show the outcome screen with labels (Checkout's "See it paid", Open the Register's "Closure N written"). Here the cashier has to imagine where "the store details at the top" are and what "the label, then the number" looks like. **Smallest fix:** add one cropped shot of the top of a thermal receipt with two callouts: ① the label (for example **VAT ID**, or a Custom label) and ② the number. Put it before the list of which templates print the numbers.

3. **Intro and step 1 (Language / Consistency).** The same admin path is written three times before the first step: the monospaced `WP admin: WP Admin → POS → Settings → General → Store details` line, the intro sentence, and step 1. The three versions also end in different places (Store details, Store tax IDs, and "just below the Refund & Returns Policy box"). None of the approved pages opens with a code-style path line. They open with one plain sentence about what the page walks through, plus a call-out for any requirement. Terms like "bundled receipts", "plain report templates" and "click outside the box" are also not words a cashier would say. **Smallest fix:** delete the `WP admin:` line. Cut the intro's second sentence down to "A manager sets them up once in WP Admin; this page shows how." Leave step 1 as the only place the full path appears.
