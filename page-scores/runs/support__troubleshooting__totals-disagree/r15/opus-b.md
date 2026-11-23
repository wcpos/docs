<!-- page-scores run: doc=support/troubleshooting/totals-disagree climb=support__troubleshooting__totals-disagree round=15 judge=opus-b -->
| Category | Totals Don't Match (page) | Baseline | J1 Open the Register | J2 Checkout | J12 Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 9 | 8.5 | 6.5 | 8 |
| Language | 5.5 | 5.5 | 7.5 | 8 | 7.5 | 6.5 | 7.5 |
| Visuals | 6 | 6 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Layering | 8 | 8 | 8.5 | 9 | 9 | 8 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 7 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 8 |
| **Average** | **6.8** | **6.8** | **8.5** | **8.7** | **8.5** | **6.1** | **6.4** |

*The page and `Baseline` are identical: the text matches and every desktop and phone screenshot I compared side by side matches. That is why the two columns have the same scores.*

1. **"What the notice means": visuals and task clarity.** The page is about one on-screen notice, but it never shows it. The four parts of the notice are described only in a bulleted list. A cashier with the warning on the till has nothing to match it against. The page also never says which figure to charge. It says "Check the total with the customer" but doesn't say whether to take the till's figure or the store's. **Smallest edit:** add a screenshot of the cart with the notice on it, numbered 1–4 to match the existing bullets, the way the approved pages do. Add one sentence before "Check the total…": "Take payment for your store's figure, the one after the →."

2. **"3. Fetch the tax rates again": visuals.** This screenshot starts partway down a long Database table: its top row is cut off mid-sentence, and the Tax rates row the cashier needs sits halfway down. On a phone the whole shot is too small to read. Badges 1 and 2 sit on top of the menu text they point to, so "Check for changes now" shows as "eck for changes now". The shot also has no badge on the ⋮ button the step tells you to press. **Smallest edit:** crop the shot to the Tax rates row plus its open menu. Move badges 1 and 2 to the left edge of the menu. Add a badge on the ⋮ and put it first in the legend.

3. **"First, make sure the POS has your store's settings" through "What to send us": language and accuracy signals.** Admin wording runs straight on in the cashier's steps: code-font `WP Admin > WooCommerce > Settings > Tax` paths, "plugin", "event code", "WooCommerce Tax". The headings also point the wrong way. Check 1 is titled "Check the tax rows set in WooCommerce", but the cashier does it in the POS under Settings > Tax. "There are three causes… If none of them fits, send us the details" contradicts itself, because the third cause ("A bug in the POS") already means "send us the details". **Smallest edit:**
   - Rename check 1 to "Check the tax settings in the POS". Write the WP Admin paths as plain bold text, as the approved pages do.
   - Change the "What causes it" opener to "There are three causes, and the notice looks the same for all of them."
   - Turn the line "The causes below are for them" into a call-out headed "FOR WHOEVER MANAGES YOUR STORE". That way the cashier can see where their part ends.
