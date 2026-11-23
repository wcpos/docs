<!-- page-scores run: doc=payment/gateways/sumup-terminal climb=payment__gateways__sumup-terminal round=21 judge=opus-a -->
| Category | SumUp Terminal Gateway | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 9 | 8 | 6.5 | 7 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 6 | 6 | 9 | 9 | 8 | 4 | 3 |
| Structure | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6.5 | 7 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7 | 5.5 |
| Consistency with approved pages | 7 | 7 | 9 | 9 | 8.5 | 5 | 4.5 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| Admin setup | 8.5 | 8.5 | 7.5 | 6.5 | 6 | 6 | 4 |
| **Average** | **7.4** | **7.4** | **8.4** | **8.4** | **8.0** | **6.1** | **5.7** |

1. **Take a payment — Visuals / Consistency.** The page's only cashier task has no screenshot. Each section of the approved pages that says "press this" has a numbered, labelled screenshot. This section asks the cashier to find the SumUp Terminal tile, check the reader shown under it, press **Send … to SumUp Terminal**, and watch the steps Sent, On terminal, Approved and Captured, all from text alone. **Smallest fix:** add one numbered screenshot of the payment screen with the SumUp Terminal tile selected, showing the same screen as Checkout's "Take the payment" shot. Label five things: the tile, the reader line (Terminal: … / Change), the Send button, the progress steps, and Cancel on terminal.

2. **Take a payment, "Stop a Bluetooth payment on the reader" warning — Language / Accuracy signals.** "Its Cancel on terminal button only shows Cancel on the reader" reads like a broken sentence. It also seems to contradict step 3 a few lines above, which says "To stop, press Cancel on terminal". A cashier stuck mid-payment will read it twice. **Smallest fix:** change the body to "With a Bluetooth reader, the till shows **Cancel on the reader** instead of a cancel button. Press cancel on the reader itself."

3. **Set up the gateway (Turn it on for the POS, Check it worked) — Admin setup / Visuals.** In the Gateways-table screenshot, label 2 ("Enabled — switch it on") sits on the `sumup_terminal_for_woocommerce` ID column, not on the switch. Also, "Check it worked" has no picture of success. The only Connection Status screenshot on the page is the red **API Key Required** failure, down in troubleshooting, so the admin can't compare their screen with what "working" looks like. **Smallest fix:** move label 2 onto the switch at the end of the SumUp Terminal row. Then add a one-label screenshot of Connection Status reading **Connected to SumUp**, with Merchant Information below it, under "Check it worked" step 1.
