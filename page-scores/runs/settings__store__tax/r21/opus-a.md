<!-- page-scores run: doc=settings/store/tax climb=settings__store__tax round=21 judge=opus-a -->
| Category | POS Tax (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6.5 | 7.5 |
| Language | 6 | 6 | 7.5 | 8 | 7.5 | 6.5 | 7 |
| Visuals | 8 | 8 | 9 | 9 | 8.5 | 2.5 | 3 |
| Structure | 7 | 7 | 8.5 | 8.5 | 8 | 7.5 | 7 |
| Layering | 7.5 | 7.5 | 8.5 | 8.5 | 9 | 8 | 5.5 |
| Consistency with approved pages | 8 | 8 | 9.5 | 9.5 | 9.5 | 4 | 4 |
| Accuracy signals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 7.5 | 8 |
| **Average** | **7.1** | **7.1** | **8.6** | **8.6** | **8.4** | **6.1** | **6.0** |

1. **If something goes wrong → "Prices look lower than the sticker" (task clarity).** The entry explains why the prices look low but never says how to fix it, so the cashier can't act on it from this page. "The wrong rate" has a similar gap: it describes the tax address button but doesn't link to the section that shows the button. **Smallest edit:** add "Set Display Prices in the Shop and Display Prices During Cart and Checkout to **Including tax**. See How tax is shown." to the first entry, and link "tax address button" in "The wrong rate" to *Which rates apply to this sale*.

2. **Check the tax rates, labels 2 and 3 (layering / language).** The labels on the rates shot hold the compound-tax sums ("on $100, $10 then $2.20, so 12.2% in all") and the remark "It shows Compound too, but no rate comes before it". That is internal maths a cashier doesn't need, and the second reads like an excuse for an odd screen. The page already has a collapsed **Rounding and compound taxes** block where this belongs. **Smallest edit:** cut label 2 to "a marked row: this rate applies to the cart's address" and label 3 to "also marked: only in Alabama at these postcodes". Move the compound sums into the **Rounding and compound taxes** block and link to it from label 3.

3. **The Tax page, label 3 "Open" (accuracy signals).** This edit changed "WooCommerce's tax settings" to "your WooCommerce settings". That fixes a contradiction with *Set in WooCommerce*, which says Enable Taxes lives on Settings > General. But the label is now vague: it no longer says where each Open link goes, and the reader has to scroll several sections to find out. **Smallest edit:** "Open — opens that row's page in WooCommerce: **General** for Enable Taxes, **Tax** for the other three. Each greyed-out row has its own **Set in WooCommerce** note and **Open** link."
