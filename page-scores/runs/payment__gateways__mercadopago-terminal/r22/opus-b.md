<!-- page-scores run: doc=payment/gateways/mercadopago-terminal climb=payment__gateways__mercadopago-terminal round=22 judge=opus-b -->
| Category | Mercado Pago Terminal Gateway (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 7 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Visuals | 6 | 6 | 9 | 9 | 9 | 3 | 3 |
| Structure | 8 | 8 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7 | 7 | 10 | 10 | 10 | 5 | 5 |
| Accuracy signals | 7 | 6.5 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 8.5 | 8.5 | 7.5 | 7 | 7 | 6 | 5 |
| **Average** | **7.44** | **7.38** | **8.88** | **8.81** | **8.69** | **6.25** | **6.13** |

**Findings**

1. **Take a card payment: Visuals.** The cashier part of the page has no screenshot. All three approved pages put a numbered, labelled screenshot of the till on each task section. Here the cashier has to find "Choose a terminal" or "Terminal: … Change", "Full balance", "Send … to Mercado Pago Terminal" and "Waiting for the customer on the terminal" from text alone. **Smallest fix:** under step 5, add one numbered screenshot of the payment screen with the Mercado Pago Terminal tile selected. Label six things: the tile, the terminal line with Change, the amount, Full balance, the Send button, and the waiting state with Cancel on terminal.

2. **Switch your terminals to PDV and Check it worked: Admin setup and Visuals.** The only screenshot of the "Mercado Pago diagnostics" area (under Logs and support bundle) shows the failed state: "Mercado Pago access token is missing." The admin never sees the success message, "Credentials accepted.", or the terminal table with its Mode column and the Switch to PDV button. That is the step where an admin is most likely to get stuck, and the way they confirm setup worked. **Smallest fix:** in Switch your terminals to PDV, add a numbered screenshot from a set-up store. Label the "Credentials accepted." line, a terminal row, the Mode column showing STANDALONE, and Switch to PDV. Link to it from step 1 of Check it worked.

3. **Enter your access token (label 4) and Settings reference (Mode row): Accuracy signals.** The admin is told to set Mode to Live, and in the same breath told that Mode decides nothing. Both sections say this, but in different words: the label calls the hint "out of date", while the reference row says "whatever the field's own description says". It reads like guidance nobody is sure of. **Smallest fix:** use one sentence in both places: "Set it to **Live**. It's a label only: your access token decides whether payments are real, and the hint under the field is out of date."
