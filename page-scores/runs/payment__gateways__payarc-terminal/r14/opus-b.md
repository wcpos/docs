<!-- page-scores run: doc=payment/gateways/payarc-terminal climb=payment__gateways__payarc-terminal round=14 judge=opus-b -->
| Category | PayArc Terminal (page) | Baseline | J1 Open the Register | J2 Checkout | J12 Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6 | 7 |
| Visuals | 6 | 4.5 | 9.5 | 9.5 | 9 | 3.5 | 4 |
| Structure | 7 | 6.5 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8 | 6.5 | 9 | 9 | 9.5 | 7.5 | 6 |
| Consistency with approved pages | 7 | 6.5 | 9.5 | 9.5 | 9.5 | 5 | 5.5 |
| Accuracy signals | 7 | 6.5 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 8.5 | 5.5 | 8 | 7.5 | 7.5 | 7 | 5.5 |
| **Average** | **7.2** | **6.3** | **8.9** | **8.9** | **8.7** | **6.3** | **6.4** |

1. **Take a card payment: Visuals (and task clarity).** The cashier's part of the page has no screenshot at all. All four screenshots are of WP Admin. The approved pages each show the till screen with numbered labels. Here the cashier has to find the **PayArc Terminal** tile, **Terminal: …**, **Change**, **Send … to PayArc Terminal** and the four-step **On the terminal** status from text alone. **Smallest fix:** add one labelled screenshot of the checkout screen with the PayArc tile selected. Label the tile, Terminal: … with Change, the amount, the Send button, and the step row with **Cancel on terminal** and **Details**.

2. **Check it worked: Accuracy signals and Admin setup.** This section is supposed to show what a working setup looks like, but its screenshot shows a store that isn't set up: every row reads **Not configured** and **Discovered terminals** is 0. Step 2 also says "0 is fine", yet "Terminal Registry is empty" is listed later under **If setup goes wrong**. That reads as a contradiction. **Smallest fix:** retake the screenshot from a store that is set up, showing **Configured**, a terminal count and **Settings validation passed**. Then add one line to the "Terminal Registry is empty" item saying when an empty list is only a warning, because the serial number you typed is still offered.

3. **Enter your PayArc credentials: Admin setup.** The page doesn't say exactly where in PayArc to find the keys. **ClientSecret** comes "from the API section of the PayArc dashboard" and **SecretKey** is "the API token from the PayArc dashboard". Neither gives a menu path, and neither says whether to use the live or the test dashboard for that key. The screenshot also has 5 labels for 6 fields: **Callback bearer token** has none. **Smallest fix:** give the exact PayArc dashboard menu for each of MID, ClientSecret and SecretKey, add "(live dashboard; test dashboard for Test mode)" to each, and add a 6th label for Callback bearer token.
