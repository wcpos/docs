<!-- page-scores run: doc=payment/gateways/authorize-net-terminal climb=payment__gateways__authorize-net-terminal round=8 judge=opus-b -->
I compared the three approved pages and the two competitor pages, then scored the page and the baseline the same way.

| Category | Authorize.net Tap to Pay | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6 | 7 |
| Language | 7 | 7 | 8 | 8.5 | 8 | 6.5 | 7 |
| Visuals | 5.5 | 5.5 | 8.5 | 9 | 8.5 | 3.5 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7.5 | 5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7.5 | 7 | 9 | 9 | 9 | 7.5 | 8 |
| Admin setup | 9 | 8.5 | 8 | 7.5 | 7 | 7 | 5 |
| **Average** | **7.5** | **7.25** | **8.5** | **8.69** | **8.44** | **6.13** | **5.88** |

1. **Take a payment, and the Legacy tab steps under "When the customer may have paid" — Visuals.** The cashier part of the page has no screenshot of the till. The only two labelled shots are admin screens (the gateway settings and the Gateways table). The cashier has to find the Authorize.net Tap to Pay tile, the **Terminal:** line, the **Send … to Authorize.net Tap to Pay** button and the waiting state from text alone. The Legacy tab list, where they must pick the right payment, also has no picture. Every approved page labels each till screen it walks through. **Fix:** Add one labelled shot of the Payments tab after the tile is tapped, with labels for the tile, Terminal:, Send, the waiting message and Cancel on terminal. Add one labelled shot of the Legacy tab list showing the heading, one row (card type, last 4 digits, time, transaction number) and where to press.

2. **Get your API credentials, step 1 — Structure (Admin setup too).** This step is now five sentences long. It covers copying the Login ID, creating a Transaction Key and which environment to use. In the middle sits a warning: a new key replaces the old one, which can break the online shop. That warning is the highest-risk sentence in the setup, and it reads as ordinary body text. **Fix:** Split it into "1. Copy the API Login ID. 2. Copy your saved Transaction Key, or create one and copy it straight away." Move "A new key replaces the old one…" into a warning call-out directly under those steps.

3. **When the customer may have paid, Legacy tab steps 3 and 4 — Task clarity / Accuracy signals.** In the rendered page, the bold sample heading in step 3 runs on into "Pick the one you just took." That instruction reads as if it were part of the on-screen heading, though the text never says whether it is. Step 4 then gives the same instruction again ("Press the one with the customer's card…"). The cashier reads one action twice and can't tell what is screen text and what is an instruction. **Fix:** End the bold at "could be this one" and delete "Pick the one you just took." If that sentence really is on screen, keep it bold but say so. Either way, step 4 remains the single instruction.
