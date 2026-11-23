<!-- page-scores run: doc=settings/store/tax climb=settings__store__tax round=21 judge=opus-b -->
| Category | POS Tax (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 6 | 6 | 9 | 9 | 8.5 | 6 | 7.5 |
| Language | 5 | 5 | 8 | 8 | 8 | 6.5 | 7 |
| Visuals | 7.5 | 7.5 | 9 | 9 | 9 | 2 | 3 |
| Structure | 6.5 | 6.5 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 7.5 | 7.5 | 9 | 9.5 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7 | 7 | 10 | 10 | 10 | 4 | 4 |
| Accuracy signals | 6.5 | 6.5 | 9 | 9 | 8.5 | 7 | 8 |
| **Average** | **6.57** | **6.57** | **9.00** | **9.07** | **8.79** | **5.71** | **6.07** |

1. **If something goes wrong → "A cent or two out" and "The POS and WooCommerce show different totals"** (accuracy signals). Both fixes end with "press Restore Server Settings on General". That clashes with the rest of the page in two ways. The intro says the four WooCommerce rows are copied every time the POS loads the store, and Set in WooCommerce says they can't be changed in the POS, so restoring them can't be needed. The WARNING also says restoring undoes every change made on this device, on General as well as Tax. So the advice reads like a guess, and following it wipes the till's own settings for nothing. **Smallest fix:** in both entries, replace "then press Restore Server Settings on General" with "the POS picks up the change the next time it loads your store". Keep Restore only for the till-only choices (Calculate tax based on and the display rows).

2. **Set in WooCommerce** (structure and layering). The right-hand contents list shows Enable Taxes, Prices Entered with Tax, Shipping Tax Class and Round Tax at Subtotal Level as headings. On the page, none of them is visible: they sit inside the closed box under the section, so tapping one of those links lands on a closed box. The box's title also names Enable Taxes, straight after "The other three rows are on Tax options". That looks like a contradiction. **Smallest fix:** rename the box "Prices Entered with Tax, Shipping Tax Class and Round Tax at Subtotal Level". Turn the four headings inside it into bold labels so they drop out of the contents list.

3. **Check the tax rates, screenshot** (visuals). At phone width the Tax Rates shot shrinks to an unreadable thumbnail. Badge 1 covers the "Standard rate" tab label it names. Badge 2 sits on the City cell, not on the blue bar the legend tells the reader to look for. The bullet just below says that on a phone the tabs become a list, but no shot shows that. **Smallest fix:** crop the shot to the dialog, dropping the greyed-out product column, and move badge 2 onto the blue bar at the row's left edge. That makes it readable on a phone without adding a new shot.
