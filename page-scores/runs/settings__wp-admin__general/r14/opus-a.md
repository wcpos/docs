<!-- page-scores run: doc=settings/wp-admin/general climb=settings__wp-admin__general round=14 judge=opus-a -->
| Category | General | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 9 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8 | 8 | 5.5 | 6.5 |
| Visuals | 7 | 7 | 9 | 9 | 8.5 | 4 | 4.5 |
| Structure | 7.5 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Layering | 8 | 7.5 | 9 | 9 | 9 | 7 | 6 |
| Consistency with approved pages | 7.5 | 7 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7 | 7.5 | 8.5 | 8.5 | 8.5 | 6 | 7 |
| **Average** | **7.14** | **7.00** | **8.71** | **8.79** | **8.57** | **5.64** | **6.29** |

1. **Register → callout 2 "Ask a manager when the count is out" · Accuracy signals.** This round added "The screen's hint says a manager's code; in the POS the manager approves by signing in with their WordPress username and password." Now the page argues with its own screenshot, whose hint says "manager's code". To a cashier, that reads as a contradiction nobody resolved. Open the Register already states the sign-in flow plainly. **Fix:** delete the "screen's hint" clause and go back to the baseline wording: "The manager signs in with their WordPress username and password; see When the count is out." Flag the mismatched hint text to the product team separately, not on the page.

2. **Register (body, Pro callout and shot) · Structure / Layering.** The section now gives the layout three times:
   - Line 57 already says the upgrade link exists.
   - Line 59 repeats where it sits on the free plugin.
   - The Pro callout carries body text ("The shot below shows this view") that tells the reader which version the only screenshot shows.

   The free-plugin layout, which most readers will see, is only described and never shown. The reader has to match the shot to their own screen through a call-out. **Fix:** delete line 59. Move "The shot below shows this view" out of the callout into a one-line lead above the shot: "Shown with WCPOS Pro and one store. On the free plugin, Opening float sits under Open and close the register, and More registers and stores with Pro takes the place of Manage stores." The callout then holds only the Pro difference.

3. **Where these settings show up (callout 4) · Products shot (callout 4) · Barcode Field · Language.** Code names show up in body text: `_sku` and "the product's SKU (_sku)" in callout 4, plus `_global_unique_id`. "Rebuilds its barcode lookups on its next sync" is also product internals. None of these is something a cashier would say out loud. The approved pages keep internals out of callouts. **Fix:** in Products callout 4, write "here the product's SKU" and drop `(_sku)`. Keep the two code names only in the Barcode Field bullet list, where the admin has to match them in the dropdown. Change "rebuilds its barcode lookups on its next sync" in both places (Barcode Field and If something goes wrong) to "picks up the new field the next time it updates its products".
