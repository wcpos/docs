<!-- page-scores run: doc=settings/store/tax climb=settings__store__tax round=23 judge=opus-a -->
| Category | POS Tax (page) | Baseline | Open the Register | Checkout | Product Panel | Square (Build cart) | Shopify (Quick reference) |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 5.5 | 6.5 |
| Visuals | 8.5 | 8.5 | 9 | 9 | 9 | 3 | 3 |
| Structure | 7 | 7 | 8.5 | 8.5 | 8 | 7 | 7 |
| Layering | 8.5 | 8 | 9 | 9 | 9 | 8 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9.5 | 9.5 | 9 | 4 | 4 |
| Accuracy signals | 7 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **7.43** | **7.36** | **8.71** | **8.86** | **8.57** | **5.79** | **5.86** |

1. **If something goes wrong: task clarity and consistency.** Most of the fixes send the reader to `WP Admin > WooCommerce > Settings`: turning on Enable Taxes, setting a product's Tax status, adding rates, and Round Tax at Subtotal Level. None of them says who should do it. A cashier usually can't get into WP Admin, so they're left stuck at the till. The approved pages say who acts: Open the Register uses "a manager signs in" and "a manager adds one". **Smallest edit:** begin each step that happens in WooCommerce with "Ask a manager to…". For example: "2. Ask a manager to check the product's **Tax status** is **Taxable** in WooCommerce." Do the same in "The wrong rate" and "A cent or two out."

2. **Which rates apply to this sale: structure.** The cashier will most often come to this page to answer "why is this sale taxed like this?" The answer is the tax address button under the products. Right now it sits in an H3 under "Check the tax rates", five sections down, after a full rates table full of priorities and compound-tax maths. It can't be found in under a second. **Smallest edit:** make it an H2 placed straight after "The Tax page". Also add one line to the intro: "To see why a sale is taxed the way it is, see Which rates apply to this sale."

3. **How the POS works out tax / Set in WooCommerce: accuracy signals.** The note that with WooCommerce Tax the first sale at a new location can differ once appears four times. Under "How the POS works out tax" it is a loose sentence after the collapsed block, and it is repeated three times in the troubleshooting section. Repeating it this often makes it read like a hedge. Separately, the text says "The other three rows are on WooCommerce's Tax options", but the collapsed block right below it is titled with all four rows, Enable Taxes included. That reads as a contradiction. Enable Taxes' path is also given twice, at lines 120 and 122. **Smallest edit:**
   - Move the loose WooCommerce Tax sentence inside the "Rounding and compound taxes" block, and keep only one mention under "If something goes wrong".
   - Retitle the block "Prices Entered with Tax, Shipping Tax Class and Round Tax at Subtotal Level".
   - Delete the parenthetical "(Enable Taxes is on Settings > General, below)".
