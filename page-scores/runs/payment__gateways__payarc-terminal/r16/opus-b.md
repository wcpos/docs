<!-- page-scores run: doc=payment/gateways/payarc-terminal climb=payment__gateways__payarc-terminal round=16 judge=opus-b -->
| Category | Open the Register (j1) | Checkout (j2) | Product Panel (j12) | Square: Build your customer's cart | Shopify: Quick reference – processing a sale | PayArc Terminal Gateway | Baseline |
|---|---|---|---|---|---|---|---|
| Task clarity | 8.5 | 9 | 8.5 | 6.5 | 7.5 | 8 | 8 |
| Language | 8 | 8.5 | 8 | 6.5 | 7 | 6.5 | 6.5 |
| Visuals | 9 | 9 | 8.5 | 4 | 4.5 | 6.5 | 6.5 |
| Structure | 8.5 | 9 | 8.5 | 7 | 7.5 | 7.5 | 7.5 |
| Layering | 8.5 | 9 | 9 | 7.5 | 6 | 8.5 | 8.5 |
| Consistency with approved pages | 9.5 | 9.5 | 9.5 | 4 | 4 | 7.5 | 7.5 |
| Accuracy signals | 9 | 9 | 8.5 | 7.5 | 7.5 | 7.5 | 7.5 |
| Admin setup | 8 | 7.5 | 7 | 6 | 4.5 | 8 | 8 |
| **Average** | **8.63** | **8.81** | **8.44** | **6.13** | **6.06** | **7.5** | **7.5** |

1. **Take a card payment / Cancel a payment: Visuals.** The cashier's part of the page has no screenshot. All the labelled shots are of WP Admin screens. The cashier only gets text for the PayArc tile, **Terminal: …** with **Change**, the **Send … to PayArc Terminal** button, the four-step **On the terminal** tracker, **Details**, **Cancel on terminal** and **Release this payment**. Every approved page labels each till screen the cashier touches, often with 8 or 9 labels. **Smallest fix:** add two labelled till shots in the Checkout style. The first shows the tender pane with the PayArc tile selected and labels the tile, Terminal/Change, the amount and the Send button. The second shows On the terminal and labels the four steps, Details, Cancel on terminal and Release this payment.

2. **Enter your PayArc credentials / Check it worked: Admin setup.** The page never says where each key is in PayArc's dashboard. The ClientSecret comes from "the API section", the SecretKey is "the API token from the PayArc dashboard", and Test only points to "PayArc's test dashboard". No dashboard menu path is given, so the admin has to go looking. The Check it worked shot also shows the failed state (**Not configured**, **0**, **Not configured**), so the admin has nothing to compare a working setup against. **Smallest fix:** in each numbered line, give the exact PayArc dashboard menu for the MID, ClientSecret and SecretKey, plus the test dashboard's address. Retake the diagnostics shot after a successful Connect so labels 1 and 3 read **Configured**.

3. **Take a card payment, Cancel a payment, If a payment goes wrong, Refund: Language.** Internal terms aimed at admins are mixed into the cashier's text: "how the card was read and PayArc's authorization code", "while your store keeps checking the terminal", "cannot be read under the current PayArc credentials" and "taken by the plugin's own order-pay panel". A cashier wouldn't say these out loud and can't act on them. The anchors keep this kind of detail behind a link. **Smallest fix:** cut the Details paragraph down to "**Details** shows the payment's history and the card's last 4 digits." Rename the two credential and plugin entries in the expanding troubleshooting lists to what the cashier sees, followed by "ask your manager". Move their current wording inside the expanded text.
