<!-- page-scores run: doc=payment/gateways/windcave-terminal climb=payment__gateways__windcave-terminal round=25 judge=opus-a -->
| Category | Windcave Terminal Gateway (page) | Baseline | Open the Register (approved) | Checkout (approved) | Product Panel (approved) | Square: Build your customer's cart | Shopify: Quick reference, processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 8.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 8 |
| Visuals | 7.5 | 7.5 | 9 | 9 | 9 | 3 | 3.5 |
| Structure | 8 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 9 | 9 | 9 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 8.5 | 8.5 | 9.5 | 9.5 | 9.5 | 5 | 5 |
| Accuracy signals | 8.5 | 8.5 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 9 | 8.5 | 8 | 7.5 | 7 | 6 | 5 |
| **Average** | **8.3** | **8.1** | **8.9** | **8.8** | **8.6** | **6.2** | **6.3** |

**1. Take a card payment / Cancel a payment: Visuals**
The only till screenshot shows the tender pane before the payment is sent. The cashier spends most of the time on the next screen, and the page never shows it. That screen has "On the terminal" with its four steps (Sent, On terminal, Approved, Captured), **Details** and **Cancel on terminal**. The text points to those controls (`page.txt:26`, `:41`, `:52`), but the cashier has nothing to match them against. It's also the screen where a wrong tap costs money.
**Smallest fix:** under step 4, add one annotated shot of the in-progress state in the same style as the approved pages. Label the four steps, **Details** and **Cancel on terminal**. If possible, also show the "Cancelling — waiting for the terminal to confirm" state.

**2. Cancel a payment: Structure**
"Released doesn't mean cancelled: press it only once a manager has checked the Windcave portal…" (`page.txt:56`) is the riskiest instruction on the page, and it sits in plain body text. A less risky warning a few lines further down ("Don't take the payment again") gets a warning call-out. A cashier skimming at the till can press **Release this payment** and then take the card a second time.
**Smallest fix:** move that one sentence into a warning call-out with the same style as "DON'T TAKE THE PAYMENT AGAIN". The rest of the paragraph stays as body text.

**3. Take a card payment: Language**
The cashier sections use several names for one device. It's called a "terminal", "Station", "Station ID" and "reader" ("listed as a reader under **Smart readers**"). The screen labels it **Choose a terminal** and **Terminal:**. Body text and the legend also switch between "until a terminal is chosen" and "the Station it went to" (`page.txt:38`, `:41`). The cashier has to work out that these are all the same thing.
**Smallest fix:** in the cashier sections (Take a card payment through Refund), say "terminal" throughout. Keep "Station ID" only for the code shown on the button, which step 2 already explains. Leave "Station" and "reader" to the admin sections.
