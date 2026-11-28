<!-- page-scores run: doc=settings/store/tax climb=settings__store__tax round=25 judge=opus-a -->
| Category | POS Tax (page) | Baseline | Open the Register | Checkout (sell to a guest) | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6.5 | 7.5 |
| Language | 6 | 5.5 | 8 | 8.5 | 8 | 6.5 | 7 |
| Visuals | 8 | 8 | 8.5 | 8.5 | 8.5 | 3 | 3 |
| Structure | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 7 | 7 |
| Layering | 8 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 5 |
| Consistency with approved pages | 7 | 7 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.0** | **6.9** | **8.5** | **8.6** | **8.4** | **6.0** | **5.9** |

### Highest-leverage findings

**1. Set in WooCommerce · Accuracy signals**
- **What's wrong:** The text says "The other three rows are on WooCommerce's Tax options". The fold-out right after it is titled "Enable Taxes, Prices Entered with Tax, Shipping Tax Class and Round Tax at Subtotal Level", which is four rows. One of them, Enable Taxes, was just shown to live on a different WooCommerce screen. The section's first paragraph also squeezes the second location into a bracket ("Enable Taxes is on Settings > General, below"). A reader comparing these will think one of them is wrong.
- **Smallest fix:** Rename the fold-out to "Prices Entered with Tax, Shipping Tax Class and Round Tax at Subtotal Level". Delete the bracketed aside in the first paragraph, because the next paragraph already covers it.

**2. Page opening (above "The Tax page") · Language and Consistency**
- **What's wrong:** The page opens with a code-styled line, "POS settings: `Settings → Tax`". Then come two paragraphs about values being copied from the store and kept on the device until you restore server settings. That's sync detail, not a reason a cashier would open this page. The approved pages open with one plain sentence about the situation ("A customer walks up with something to buy…") and put any condition in a call-out.
- **Smallest fix:** Replace the first three paragraphs with one sentence, for example: "Open Settings, then Tax, when a price or a tax line at the till doesn't look right." Move the "comes from your store / kept on this device" point into a single NOTE call-out. Drop the code styling on the menu path.

**3. "Which rates apply to this sale" · Structure**
- **What's wrong:** This is the one part a cashier uses at the till: the tax address button in the cart, which shows the address and rates being applied. It's tucked under "Check the tax rates" as a smaller heading, after the admin-style table of all rates. On a phone it's several screens down. The fix for "The wrong rate" under "If something goes wrong" sends the cashier to that button but doesn't link to the section.
- **Smallest fix:** Make it a full section of its own, placed straight after "The Tax page". In "The wrong rate", add "See Which rates apply to this sale."
