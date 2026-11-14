<!-- page-scores run: doc=payment/gateways/windcave-terminal climb=payment__gateways__windcave-terminal round=25 judge=opus-b -->
| Category | Windcave Terminal Gateway | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7.5 | 8.5 | 9 | 8.5 | 6 | 7 |
| Language | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 6 | 7 |
| Visuals | 7 | 7 | 9 | 9 | 8.5 | 3 | 2.5 |
| Structure | 8 | 7.5 | 8.5 | 9 | 8.5 | 7 | 7 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 8.5 | 7.5 | 5 |
| Consistency | 8.5 | 8 | 9.5 | 9.5 | 9.5 | 4 | 4 |
| Accuracy signals | 8 | 8 | 9 | 9 | 9 | 7.5 | 7 |
| Admin setup | 8.5 | 8 | 7.5 | 6.5 | 6.5 | 6 | 4.5 |
| **Average** | **8.0** | **7.75** | **8.6** | **8.6** | **8.4** | **5.9** | **5.5** |

1. **Take a card payment / Cancel a payment — Visuals.** There is only one screenshot for the cashier, and it shows the screen before the payment is sent. The page never shows the screen the cashier watches while the customer pays. That screen holds the four steps (Sent, On terminal, Approved, Captured), **Cancel on terminal**, **Details**, and later **Release this payment** and the "Cancelling — waiting for the terminal to confirm" message. These are the controls where a wrong tap can charge a customer twice, and the cashier has to find them from text alone. **Smallest fix:** add one numbered screenshot of the "On the terminal" screen after step 4. Label the four steps, Cancel on terminal and Details, and say in one line where Release this payment appears.

2. **Set up Windcave Terminal → Requirements / Enter your HIT credentials — Admin setup.** The admin is only told to "contact Windcave and ask". The page doesn't say what Windcave sends back, or which value goes into which field. The settings screenshot has every field empty, so the admin can't check the format: one Station ID per line, and a username that's different for UAT and production. **Smallest fix:** under Requirements, add a three-row list: "Ask Windcave for → goes in field". The rows are UAT HIT username → HIT username, UAT HIT key → HIT key, and Station ID of each terminal → Station IDs. Then retake the settings screenshot with sample values filled in, such as a username and `DOCS-STATION-1` / `DOCS-STATION-2` on separate lines.

3. **Take a card payment — Visuals / Task clarity (phone).** At phone width, the checkout screenshot shrinks the whole tender pane and the cart panel into about 330 px. The tile names, Station ID buttons and the Send button can't be read, so on the phone beside the till the six labels point at blurs. The cart panel on the right isn't mentioned by any label. **Smallest fix:** crop the screenshot to the left payment pane (tabs down to the Send button) and keep the same six labels. That makes it about twice as large on a phone, and nothing it teaches is lost.
