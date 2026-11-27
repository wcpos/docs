<!-- page-scores run: doc=settings/store/tax climb=settings__store__tax round=23 judge=opus-b -->
| Category | POS Tax (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 6.5 | 9 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 8.5 | 9 | 8.5 | 6 | 7 |
| Visuals | 7.5 | 7.5 | 9 | 9 | 8.5 | 3.5 | 3.5 |
| Structure | 7 | 7 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8 | 7.5 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9.5 | 9.5 | 9.5 | 4 | 4.5 |
| Accuracy signals | 7 | 7 | 9 | 9 | 9 | 7.5 | 7.5 |
| **Average** | **7.21** | **7.07** | **8.86** | **9.07** | **8.79** | **5.93** | **6.14** |

1. **"Which rates apply to this sale" (H3 under "Check the tax rates") — Structure / Task clarity.** This is the one cashier task on the page: "why is this sale charged this tax?" But it sits as a sub-heading under an admin-level list of rates. Above it come a long intro about where settings live, an 11-callout settings shot and three sections about options. The approved pages open with the cashier's task, for example "A customer walks up with something to buy…". **Smallest fix:** make it an H2 placed straight after "The Tax page". Add one opening sentence: "To see why a sale is charged the tax it is, press the tax address button under the products."

2. **"Set in WooCommerce" — Accuracy signals.** The text says "The other three rows are on WooCommerce's Tax options", but the collapsible right below it is titled with all four, Enable Taxes included. The first paragraph also says "go to … Settings > Tax (Enable Taxes is on Settings > General, below)", which gives a path and then takes it back. Both read as contradictions. **Smallest fix:** retitle the collapsible "Prices Entered with Tax, Shipping Tax Class and Round Tax at Subtotal Level". Cut the parenthetical so the sentence ends "…press **Open** on the row."

3. **"Restore server settings" first shot, and the "Check the tax rates" shot — Visuals.**
   - The General shot shows the offline failure ("Couldn't reach the store" and a full-width blue **Try again**) as if that were the normal screen. A cashier looking for the button will match against a bar they won't see.
   - In the rates shot, callout 5 "Priority" sits on the VAT row instead of the Priority column, and callout 4 "GB, Surcharge" sits on the City cell instead of the row's start. The eye lands on the wrong thing.

   **Smallest fix:** reshoot General in its normal state and move the offline case to a line under "If something goes wrong". Move callout 5 onto the PRIORITY column header and callout 4 to the left edge of the GB Surcharge row.
