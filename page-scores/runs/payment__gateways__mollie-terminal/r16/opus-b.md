<!-- page-scores run: doc=payment/gateways/mollie-terminal climb=payment__gateways__mollie-terminal round=16 judge=opus-b -->
| Category | Mollie (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6 | 7.5 |
| Language | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 6.5 | 7.5 |
| Visuals | 6 | 6 | 9.5 | 9.5 | 9 | 3 | 3 |
| Structure | 7 | 7 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9.5 | 9.5 | 7.5 | 6 |
| Consistency with approved pages | 7 | 7 | 10 | 10 | 9.5 | 4 | 4.5 |
| Accuracy signals | 8 | 8 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 9 | 9 | 8 | 7.5 | 7.5 | 6 | 5.5 |
| **Average** | **7.6** | **7.6** | **9.0** | **9.0** | **8.8** | **6.0** | **6.2** |

1. **Take a payment (Visuals / Consistency).** The cashier half of the page has no screenshots at all: Take a payment, Cancel, declined, not confirmed, Legacy tab and QR code. Every annotated shot is in the admin half. The approved pages give every till screen a shot with 6 to 9 numbered labels. A cashier is left matching "Terminal:", "Change", "Send … to Mollie Terminal", "Cancel on terminal" and the Sent → On terminal → Approved → Captured steps against a screen they've never seen. **Fix:** add one tender-pane shot with Mollie Terminal selected and the payment waiting. Label the tile, the "Terminal:" name, Change, the Send button, the step tracker and Cancel on terminal, in the same two-column legend style as the Checkout page.

2. **The terminal hasn't confirmed / If something goes wrong › The customer already paid (Structure).** The highest-risk case, a double charge, is split across two sections that send you back and forth: each one links to the other. It's also the third subheading inside Take a payment, while the approved pages put recovery cases under "If something goes wrong". A cashier with a customer standing there can't find the one place that answers "do I charge again?" in under a second. **Fix:** merge "The customer already paid" into "The terminal hasn't confirmed". Move that section, plus "Cancel a payment on the terminal" and "Payment cancelled or declined", under "If something goes wrong", and leave a one-line link in Take a payment.

3. **On the Legacy tab / Pay by QR code (Task clarity / Accuracy signals).** The section describes two different panels, one with Start Terminal Payment and Cancel Terminal Payment and one with "Send … to" and Cancel on terminal. It says which one you get "depends on whether a manager has turned on QR code payments", but the cashier can't see that setting. So the cashier has to work out which version they're on before they can follow any steps, and the two button sets read like a hedge or a contradiction. **Fix:** open the section with one sentence that sorts by what's on screen, e.g. "If you see Terminal and QR code tabs, follow A; if you see a Send button, follow B". Add a small labelled shot of each panel, or at least of the Terminal/QR code panel that the Pay by QR code steps depend on.
