<!-- page-scores run: doc=payment/gateways/email-invoice climb=payment__gateways__email-invoice round=26 judge=opus-a -->
| Category | Email Invoice (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7.5 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 7 | 7 | 8 | 8.5 | 8 | 6.5 | 7.5 |
| Visuals | 7.5 | 5 | 9 | 9 | 8.5 | 3 | 4 |
| Structure | 8.5 | 7.5 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| Layering | 9 | 8.5 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 7 | 9.5 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 8 | 7.5 | 9 | 8.5 | 9 | 7.5 | 8 |
| **Average** | **8.0** | **7.1** | **8.7** | **8.9** | **8.6** | **5.9** | **6.4** |

**1. Send it again or cancel it: visuals and task clarity.** The page sends the cashier to a screen it never shows: the order's View tab. That tab has the **Invoice sent to … on Nov 7, 3:04 PM** line and the **Send again**, **Cancel invoice** and **Re-open** buttons. Prose has to do the pointing instead ("tap its row, or with a mouse, the › at the end of the row"). This is the one section the cashier comes back to days later, with no memory of the screen. Every other screen on the page, and every task screen on the approved pages, gets a numbered shot.
*Smallest fix:* Add one labelled shot of the order's View tab under the section's opening paragraph, with numbered labels for the order row's ›, the **Invoice sent to …** line, **Send again**, **Cancel invoice** and **Re-open**. Then cut the "with a mouse, the ›" clause from the prose.

**2. Take payment in the store instead, step 2: task clarity and accuracy.** Step 2 tells the cashier a **Cancel invoice** button appears above the keypad but never says whether to press it. The intro warns the customer "could pay twice", and the Cancel it call-out says the link still takes payment while the order is open. A cashier reading those together will stop and wonder whether cancelling comes first. Step 3 does answer this ("Once the order is fully paid, the email's link can no longer take payment"), but only after the moment of doubt.
*Smallest fix:* End step 2 with: "You don't need to press it: taking the full amount stops the link." If a part payment leaves the link working for the rest, add that as one more line under step 3.

**3. If something goes wrong, first entry ("Email Invoice isn't on the Payments tab"): language and consistency.** The entry puts a version number in front of the cashier ("called **Legacy** before WCPOS 2.0.1"), along with "the extension needs updating" and an if/else they can't check. The approved Checkout page calls the same tab "**Legacy** tab (WCPOS Pro)", so the two pages disagree on the name with no link between them. The invoice-form screenshot shows the **Store checkout** tab but doesn't label it, so the cashier can't see where they're being sent.
*Smallest fix:* Rewrite the entry as: "Look on the **Store checkout** tab beside Payments (**Legacy** on some tills). If it's there, send the invoice from it. Either way, ask whoever looks after the store to switch Email Invoice on or update it. See The Legacy Tab." Move the version detail into the existing "Manual installation and older versions" fold-out, and add a numbered label for the **Store checkout** tab in the invoice-form shot.
