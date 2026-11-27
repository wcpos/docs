<!-- page-scores run: doc=payment/gateways/payarc-terminal climb=payment__gateways__payarc-terminal round=16 judge=opus-a -->
| Category | PayArc Terminal Gateway | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Visuals | 6 | 6 | 9 | 9.5 | 9 | 3 | 4 |
| Structure | 7.5 | 7.5 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 7 | 6 |
| Consistency with approved pages | 7 | 7 | 9.5 | 9.5 | 9.5 | 5 | 5.5 |
| Accuracy signals | 7 | 7 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 8 | 8 | 8 | 7.5 | 7 | 6 | 5.5 |
| **Average** | **7.25** | **7.25** | **8.9** | **8.9** | **8.6** | **6.2** | **6.4** |

1. **Take a card payment · Visuals.** The cashier's main task has no screenshot. The page has three labelled shots, and all of them are of admin screens. The cashier gets nothing for the **PayArc Terminal** tile, the **Terminal: …** line with **Change**, the **Send … to PayArc Terminal** button, or the four-step **On the terminal** progress. The approved Checkout page labels every one of its 8 tender-pane controls. **Smallest fix:** add one numbered shot of the tender pane with the PayArc tile selected. Label the tile, Terminal: …, Change, the amount field and Send …. Add a second, smaller shot of the On the terminal steps with **Cancel on terminal** and **Details** labelled.

2. **Enter your PayArc credentials / Check it worked · Admin setup.** Two gaps.
   - **Vague credential sources:** the ClientSecret comes from "the API section of the PayArc dashboard" and the SecretKey from "the PayArc dashboard". The admin isn't told which menu to open, or how to reach the test dashboard as opposed to the live one.
   - **Wrong state in the "Check it worked" shot:** the diagnostics screenshot shows the *failed* state (Not configured, 0 terminals). The admin is told what success should read but never sees it.

   **Smallest fix:** name the exact PayArc dashboard menu for the MID, ClientSecret and SecretKey, and add one line on where the test dashboard is. Retake the diagnostics shot after a successful Connect so labels 1 and 3 read **Configured**.

3. **If a payment goes wrong / Refund a PayArc payment · Language and Structure.** The cashier's troubleshooting lists include entries written in plugin internals that only an admin can act on:
   - "An earlier PayArc Terminal payment on this order cannot be read under the current PayArc credentials"
   - "This PayArc payment was taken by the plugin's own order-pay panel"
   - "Connection unstable, still trying"

   The approved pages start each problem with what the cashier sees and give the action straight away. **Smallest fix:** rename each of these entries to what is on the till screen and open it with "Ask your admin". Move the explanation that involves credentials or the order-pay panel into **If setup goes wrong** and link to it from there.

The page differs from Baseline in one place only: the WooCommerce requirement went from 7.0+ to 9.0+, with no other change and no reason given. I couldn't tell from the material which number is right, so I gave both columns the same scores.
