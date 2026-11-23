<!-- page-scores run: doc=payment/gateways/mollie-terminal climb=payment__gateways__mollie-terminal round=16 judge=opus-a -->
| Category | Mollie (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6.5 | 7 |
| Language | 7 | 7 | 8 | 8 | 8 | 6 | 6.5 |
| Visuals | 6 | 6 | 9 | 9 | 8.5 | 4 | 3.5 |
| Structure | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 8.5 | 9 | 8 | 5.5 |
| Consistency with approved pages | 6.5 | 6.5 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 8 | 8 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| Admin setup | 8.5 | 8.5 | 7.5 | 7 | 7 | 5 | 4 |
| **Average** | **7.4** | **7.4** | **8.5** | **8.4** | **8.3** | **6.0** | **5.7** |

The page's text and renders match the baseline exactly, so both columns get the same scores.

1. **Take a payment (steps 1–5): Visuals and consistency.** The cashier's main task has no screenshot at all. Every approved page opens its task with a numbered shot of the till, but here the cashier has to picture the **Mollie Terminal** tile, **Terminal:** with **Change**, the **Send … to Mollie Terminal** button, **Cancel on terminal**, and the Sent / On terminal / Approved / Captured progress steps from text alone. That is exactly what they'll be looking for on screen mid-sale. All of the page's annotated shots are of WP Admin. **Smallest fix:** add one tender-pane shot with the Mollie tile selected and a payment in progress, numbered 1–6 for the tile, Terminal:/Change, the Send button, the progress steps, Cancel on terminal and the To pay figure. Use the same two-column callout list that Checkout uses.

2. **Check it worked: Admin setup and accuracy signals.** The only diagnostics screenshot shows the failed state (`test`, `MISSING`, yellow test-mode notice), while step 1 above it describes success (`live`, `configured`, no notice). An admin checking their own screen against the picture is matching the wrong thing, and the labels have to say "yours should read…" to cover the gap. On a phone the shot is too small to read. **Smallest fix:** retake the shot with a working setup (`live`, key source `… configured`, Default terminal showing a list) and relabel 1–2 as "should read". If the failed state is worth keeping, move it under the "Default terminal is still a text box?" line as a "what not-set-up looks like" shot.

3. **On the Legacy tab: Task clarity and language.** The cashier is told the panel "depends on whether a manager has turned on QR code payments", a setting they can't see. They then get two branches with different button names (**Start Terminal Payment** / **Cancel Terminal Payment** against **Send … to** / **Cancel on terminal**), and neither branch is illustrated. "Legacy tab" and "the order's payment page" are internal terms, and the section has to be read twice to work out which branch applies. **Smallest fix:** start each branch with the button the cashier can actually see ("If you see **Start Terminal Payment**…" / "If you see **Send … to** and a terminal name…"), drop the sentence about the manager setting, and add a small two-up shot of the two panels with the buttons labelled.
