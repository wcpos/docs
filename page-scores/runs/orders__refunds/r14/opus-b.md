<!-- page-scores run: doc=orders/refunds climb=orders__refunds round=14 judge=opus-b -->
| Category | Refund Rules (page) | Baseline | J1 Open the Register | J2 Checkout | J12 Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 9 | 8 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 6.5 | 6.5 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 7 | 7 | 8.5 | 9 | 8 | 7 | 7.5 |
| Layering | 8 | 7.5 | 8.5 | 8.5 | 9 | 8 | 5.5 |
| Consistency with approved pages | 7 | 7 | 9 | 9 | 8.5 | 4 | 4 |
| Accuracy signals | 7 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 8 |
| **Average** | **6.9** | **6.9** | **8.6** | **8.8** | **8.4** | **6.0** | **6.1** |

### Findings for the page under review

**1. The Refund Form, and If a Refund Fails · Visuals**
- **What's wrong:** The same refund form appears three times:
  - a full-width shot with no labels
  - a labelled close-up of that same form
  - a third full-width shot for the offline state, also with no labels, followed by a close-up of its footer
- The cashier scrolls past about two screens of repeated pixels. The offline shot never points at the part that matters, the "Refunds need a connection" text above the greyed-out button.
- The labels use names that aren't on the screen. The legend says **Refund Qty** and **Refund Amount**, but the column headings read REFUND and AMOUNT.
- **Smallest edit:**
  - Delete the unlabelled full shot under "The Refund Form" and keep the labelled close-up.
  - In If a Refund Fails, delete the full offline shot. Keep the footer close-up and add one label on "Refunds need a connection".
  - Rename the legend entries 4 and 5 to **Refund** and **Amount**.

**2. Things to Know → "A changed payment is refunded as its new method" · Structure / Layering**
- **What's wrong:** This bullet is the only change since the baseline, and it went to the wrong place. It decides where the money goes, but it sits at the bottom of the page, under Exchanges. A cashier at "When to Use Cash vs. Original Method" sees three cases, none of which covers a payment changed after the sale, and will choose without it.
- The two "?" sections under that heading are where the cashier is already looking. This bullet links back to one of them but isn't next to them.
- **Smallest edit:** Move the bullet into "When to Use Cash vs. Original Method" as a fourth case: **Payment changed after the sale (Change tender):** the refund to the original method goes to the new method. Leave a one-line pointer in Things to Know if you want to keep it there.

**3. The Refund Form (QTY entry) and Starting a Refund · Accuracy signals**
- **What's wrong:** Starting a Refund says "You need a connection", and the page later says that offline the refund button is greyed out. But the QTY entry describes the form's behaviour "(offline, for example)", so it reads as if you can refund offline.
- The next paragraph describes a different case ("online but the store's refund history doesn't load"), so the cashier gets two versions of the same fallback.
- The shot also shows a Price of 45.00 for the watch, while the order shows $40.11. The legend only explains that Amount includes tax, not Price, so the figure looks like a mistake.
- **Smallest edit:**
  - Cut the QTY entry to: "how many of the line are still refundable: the quantity bought, less any refunded before." Let the paragraph that follows cover the history-didn't-load case on its own.
  - Add "tax included" to a Price entry, or to the Amount entry.
