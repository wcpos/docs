<!-- page-scores run: doc=payment/gateways/mercadopago-terminal climb=payment__gateways__mercadopago-terminal round=22 judge=opus-a -->
| Category | Mercado Pago Terminal (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6 | 7.5 |
| Language | 7 | 7 | 8.5 | 8.5 | 8.5 | 6 | 7 |
| Visuals | 5 | 5 | 9 | 9 | 9 | 2.5 | 3 |
| Structure | 7 | 7 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 7 | 7 | 10 | 10 | 10 | 4 | 4.5 |
| Accuracy signals | 6 | 6 | 9 | 9 | 9 | 7.5 | 8 |
| Admin setup | 8.5 | 8.5 | 8 | 7.5 | 7.5 | 6 | 5 |
| **Average** | **7.06** | **7.06** | **8.94** | **8.88** | **8.75** | **5.69** | **6.00** |

1. **Take a card payment and Cancel a payment (Visuals, Consistency).** These are the only sections a cashier needs, and neither has a single screenshot. All three approved pages give every till screen an annotated shot, and the page's two screenshots are both in the admin settings. A cashier on a phone gets five text steps naming **Choose a terminal**, **Terminal: … Change**, **Full balance** and **Send … to Mercado Pago Terminal**, with nothing to match them against. **Smallest fix:** add one numbered shot of the Payments tab, in the same style as the "Take the payment" shot on the Checkout page. Label the Mercado Pago tile, the terminal line with **Change**, the amount, **Full balance** and the **Send …** button. Then add one shot of the **Waiting for the customer on the terminal** state with **Cancel on terminal** labelled.

2. **The opening call-outs and the Mode call-out in Enter your access token (Accuracy signals, Structure).** Before step 1, the cashier gets a PRO note and a yellow warning that version 1.0 "hasn't been run on a real Point terminal". That is a hedge about the whole release, and it sits above the cashier's task. Further down, the Mode call-out now says the hint under the field "is out of date", while the screenshot shows that hint saying the opposite. The Settings reference row still uses the older wording ("set it to Live to match a production token … whatever the field's own description says"), so the same setting is explained two ways on one page. **Smallest fix:** move the untested-release warning to the top of "Set up Mercado Pago Terminal" and leave a one-line link in the intro. Then give call-out 4 and the Mode row in the table the same sentence: "Set it to **Live**. The hint under it is out of date: the access token, not Mode, decides whether payments are real."

3. **Check it worked (Admin setup, Visuals).** The admin is told to look for **Credentials accepted** and **PDV** under Mode, but they have nothing to compare against. The only diagnostics screenshot is three sections further down, under Logs and support bundle, and it shows the failure state (**Mercado Pago access token is missing.**). **Smallest fix:** in step 1 of Check it worked, add a shot of the diagnostics area after a successful setup: the **Credentials accepted** line and the terminal table with one row showing **PDV**. Or, at minimum, link step 1 to the existing shot and caption that shot as "not set up yet".
