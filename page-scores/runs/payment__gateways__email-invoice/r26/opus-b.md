<!-- page-scores run: doc=payment/gateways/email-invoice climb=payment__gateways__email-invoice round=26 judge=opus-b -->
| Category | Email Invoice (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8.5 | 8 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 7 | 7 | 7.5 | 8 | 8 | 5.5 | 7 |
| Visuals | 8 | 4.5 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 8.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 9 | 8.5 | 8.5 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 8 | 6.5 | 9.5 | 9.5 | 9.5 | 4 | 4.5 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7 |
| **Average** | **8.07** | **7.07** | **8.64** | **8.86** | **8.64** | **5.64** | **6.07** |

### Three highest-leverage findings

**1. "Send it again or cancel it": Visuals**

**What's wrong:** This is the only cashier task on the page that happens on a different screen: the order's View tab on the Orders screen. It has no screenshot. To find the order, the cashier gets a sentence ("tap its row, or with a mouse, the › at the end of the row"). To find the buttons, they get a text-only line: the "Invoice sent to …" line under Payment, then Send again, Cancel invoice and Re-open. Both checkout screens on the page are labelled, but the screen where the cashier must pick one of three buttons is not. That is exactly the shot a cashier needs to tell those buttons apart.

**Smallest edit:** Add one numbered screenshot of the order's View tab, under the opening paragraph. Label four things: the Payment line ("Invoice sent to … on …"), Send again, Cancel invoice and Re-open. Each legend entry should link to its sub-section.

**2. "If something goes wrong" → "Email Invoice isn't on the Payments tab": Consistency / Language**

**What's wrong:** The text says "Look on the Store checkout tab beside Payments (called Legacy before WCPOS 2.0.1)". A version number means nothing to a cashier. The approved Checkout page names this tab "Legacy tab (WCPOS Pro)" and shows "Legacy" in its screenshot, so a cashier who learned the till from that page meets a second name here. The item then says "you can send the invoice from there until it is" but gives no steps for doing that.

**Smallest edit:** Change it to: "Look on the **Store checkout** tab beside Payments (**Legacy** on some tills; see The Legacy Tab). If Email Invoice is there, send the invoice from that tab for now and tell whoever looks after the store that the extension needs updating." Delete the version number.

**3. "If something goes wrong" → "The order has no Send again or Cancel invoice" and "Cancel it": Accuracy signals**

**What's wrong:** The page says several times that an invoiced order "waits as Pending payment". Then this item tells the cashier the setting "should be Completed, not Pending payment". To a cashier that reads as a contradiction. The explanation is hidden in the "Why not choose Pending payment?" fold, two sections further down under Set it up. Separately, "Cancel it" ends with "In WooCommerce, its status becomes POS open". That is an internal status name the cashier never sees at the till, and it competes with the till message quoted just before it.

**Smallest edit:**
- In the troubleshooting item, add one clause after "not Pending payment": "the order still shows Pending payment to the customer either way; Completed is what lets the till track the invoice." Link it to the fold.
- In "Cancel it", delete the "In WooCommerce, its status becomes POS open" sentence, or move it into the "Messages when you cancel an invoice" fold.
