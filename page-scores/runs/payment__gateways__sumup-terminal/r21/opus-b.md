<!-- page-scores run: doc=payment/gateways/sumup-terminal climb=payment__gateways__sumup-terminal round=21 judge=opus-b -->
| Category | SumUp Terminal Gateway (page) | Baseline | Open the Register (j1) | Checkout (j2) | Product Panel (j12) | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8 | 5.5 | 6.5 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6 | 6.5 |
| Visuals | 6 | 6 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6 | 6.5 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7 | 5 |
| Consistency with approved pages | 7.5 | 7.5 | 9.5 | 9.5 | 9.5 | 5 | 5 |
| Accuracy signals | 7 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7 |
| Admin setup | 8.5 | 8.5 | 7.5 | 7 | 6.5 | 6 | 4.5 |
| **Average** | **7.4** | **7.4** | **8.6** | **8.6** | **8.3** | **5.7** | **5.5** |

1. **Take a payment: Visuals.** This is the cashier's main task, and it has no screenshot. The approved pages put a numbered shot at every stage of a sale. Checkout, for example, labels 8 parts of the payment screen. Here the cashier gets only text for the SumUp Terminal tile, the reader named under it (Terminal: … / Connected), **Change**, **Send … to SumUp Terminal**, **Cancel on terminal** and the Sent → On terminal → Approved → Captured progress steps. **Smallest fix:** add one numbered shot of the payment screen with the SumUp tile selected and the payment waiting on the reader. Label the six items above, in the same style as the Checkout page.

2. **Set up the gateway › Check it worked: Admin setup / Visuals.** The success state ("Connected to SumUp", Merchant Information, "Readers Configured") is only described in words. The only Connection Status screenshot on the page shows the failure ("API Key Required"), and it is near the bottom in troubleshooting. An admin checking their setup has nothing to compare their screen against. **Smallest fix:** in step 1 of Check it worked, add a screenshot of the Connection Status and Readers Configured boxes in their working state, with 2–3 labels: Connected to SumUp, Merchant Information, Readers Configured. Leave the red shot where it is, as the "what's wrong" example.

3. **Take a payment, step 2 and the "Stop a Bluetooth payment on the reader" warning: Accuracy signals / Language.** "Its **Cancel on terminal** button only shows **Cancel on the reader**" reads like a contradiction: a sentence earlier, the cloud Solo is cancelled with that same button. It's also unclear whether "Cancel on the reader" is a button label or an instruction. In step 2, "tap **Connect in Settings → Card readers**" makes a menu path look like one button name. **Smallest fix:** change the warning to "With a Bluetooth reader the till has no cancel button. Press Cancel on the reader itself." Change step 2 to "go to **Settings → Card readers** and tap **Connect**."
