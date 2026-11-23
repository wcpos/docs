<!-- page-scores run: doc=payment/gateways/stripe-terminal climb=payment__gateways__stripe-terminal round=26 judge=opus-a -->
| Category | Stripe Terminal (page) | Baseline | j1 Open the Register | j2 Sell to a Guest | j12 Find a Product | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7 | 9 | 9 | 8.5 | 6.5 | 7 |
| Language | 7 | 7 | 8.5 | 8.5 | 8.5 | 6.5 | 7 |
| Visuals | 7 | 5 | 9 | 9 | 8.5 | 4 | 3.5 |
| Structure | 8 | 7.5 | 9 | 9 | 8.5 | 7 | 7 |
| Layering | 8.5 | 8 | 8.5 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 8.5 | 7.5 | 9.5 | 9.5 | 9.5 | 5 | 5 |
| Accuracy signals | 8 | 6.5 | 9 | 9 | 8.5 | 7.5 | 7.5 |
| Admin setup | 8 | 5.5 | 8 | 7.5 | 7 | 6.5 | 5 |
| **Average** | **7.9** | **6.8** | **8.8** | **8.8** | **8.5** | **6.3** | **6.0** |

1. **Set up in WP Admin · Visuals / Admin setup.** Steps 3 to 6 all happen on the gateway's own settings page (WP Admin > WooCommerce > Settings > Payments > Stripe Terminal): the key fields, the two Terminal location fields, POS connections, Test Mode, the "Stripe API key is valid" lines and the "Signing secret stored." row. The page has no screenshot of that screen. The only setup shot is the POS Gateways table. Ten of its eleven rows are other gateways, and at phone width its text is too small to read. **Smallest fix:** after step 2, add one annotated shot of the Stripe Terminal settings page. Put markers on Live Secret Key, Test Secret Key, the key-valid line, Terminal location (testing) and (live), POS connections, Test Mode, the WooCommerce POS checkout row and Save changes. Crop the Gateways shot to the header plus the Stripe Terminal row.

2. **Set up in WP Admin, steps 3–6 · Accuracy signals / Task clarity.** Step 4 has the admin pick Terminal location (testing) and (live) before anything is saved. Step 6 then says "Stripe Terminal Locations lists your locations" only after Save changes. That reads as if the location lists stay empty until a valid key is saved, so an admin who follows the steps in order may find nothing to pick at step 4. **Smallest fix:** end step 3 with "Click Save changes so the page can read your Stripe account", and start step 4 with "Once saved, pick…". If the lists really do fill before saving, delete the "lists your locations" clause from step 6 instead.

3. **Set up in WP Admin, step 6 · Structure.** One paragraph does three jobs: it chooses test or live mode, it saves, and it holds three separate success signals (key valid, signing secret stored, locations listed). The admin has to read the whole paragraph again to find out whether setup worked. Step 8 ("Check it worked") also only covers smart readers. **Smallest fix:** split step 6 into "Choose the mode and click Save changes" and a new "Check the page" step with the three signals as a three-item list. In step 8, add the Bluetooth check: in the app, Card readers shows the Bluetooth readers section with Connect a reader.
