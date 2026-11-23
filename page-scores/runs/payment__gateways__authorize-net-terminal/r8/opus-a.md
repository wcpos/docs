<!-- page-scores run: doc=payment/gateways/authorize-net-terminal climb=payment__gateways__authorize-net-terminal round=8 judge=opus-a -->
I've compared all five anchors, then the page and its baseline. Here are the scores and findings.

| Category | Authorize.net Tap to Pay (page) | Baseline | Open the Register (j1) | Checkout (j2) | Product Panel (j12) | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 6 | 7 |
| Language | 6.5 | 6.5 | 8 | 8 | 8 | 6 | 7 |
| Visuals | 5.5 | 5.5 | 8.5 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 6.5 | 6.5 | 9 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| Admin setup | 9 | 8 | 7.5 | 7 | 6.5 | 5.5 | 4.5 |
| **Average** | **7.3** | **7.1** | **8.3** | **8.4** | **8.3** | **5.8** | **5.9** |

1. **Take a payment / Cancel a payment (Visuals, Consistency).** The cashier's part of the page has no screenshot at all. The only labelled shots are on the admin's WP Admin screens. Every approved page puts a numbered shot of the till screen next to the steps (for example, Checkout's tender pane with 8 labels). Here the cashier gets nothing to show them the **Terminal:** line, the **Send … to Authorize.net Tap to Pay** button, the **Waiting for the customer on the terminal** state, or **Cancel on terminal**. **Fix:** after step 3, add one numbered shot of the tender pane with the Authorize.net tile selected and the till waiting. Label the tile, Terminal: plus the phone's name, To pay, the Send button, the waiting message and Cancel on terminal.

2. **When the customer may have paid, Legacy tab steps (Task clarity, Visuals).** Step 3 bolds "Pick the one you just took." as part of the on-screen heading, then step 4 tells the cashier to pick again. That reads as two separate actions. The amount format also changes from the Payments tab ("$10.00") to "10.00 USD". This is the most stressful moment on the page (money may already be taken), and it's the only list the cashier must choose from, but it has no picture. **Fix:** merge steps 3 and 4 into one step: "A list appears, for example *2 Authorize.net payments of USD 10.00 could be this one*. Each line shows the card type, the last 4 digits, the time and the transaction number. Press the one with the customer's card and the time of the tap." Add a shot of that list with those four parts labelled.

3. **Requirements / Set up the phone / Take a payment (Consistency, Accuracy signals).** The phone app's name changes from section to section. It's "the Authorize.net 2.0 app" in Requirements and "the Authorize.net app" in Set up the phone and in the cashier steps. "Authorize.net app" is also the default **Reader name** shown on the till. So an admin installing the app can't tell whether these are two apps, and a cashier may think the till label is the app's name. **Fix:** name the app the same way everywhere, e.g. "the Authorize.net 2.0 app (Authorize.net's own app)", and say once where to get it in Set up the phone (App Store / Google Play). Leave "Authorize.net app" only as the Reader name default.
