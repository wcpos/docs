<!-- page-scores run: doc=payment/gateways/stripe-terminal climb=payment__gateways__stripe-terminal round=26 judge=opus-b -->
| Category | Stripe Terminal (page) | Baseline | j1 Open the Register | j2 Checkout | j12 Product Panel | Square (competitor) | Shopify (competitor) |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 6.5 | 9 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6.5 | 7 |
| Visuals | 7 | 4.5 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7 | 9 | 8.5 | 8.5 | 4 | 4 |
| Accuracy signals | 7.5 | 6 | 9 | 8.5 | 9 | 7.5 | 7.5 |
| Admin setup | 7.5 | 4.5 | 7.5 | 7 | 7 | 7.5 | 5.5 |
| **Average** | **7.4** | **6.3** | **8.7** | **8.6** | **8.4** | **6.1** | **6.0** |

1. **Set up in WP Admin, steps 3–6 · Visuals / Admin setup.** Steps 3 to 6 happen on the gateway's own settings page (WooCommerce > Settings > Payments > Stripe Terminal), but the page has no picture of it. That covers the Live and Test Secret Key fields, both Terminal location pickers, POS connections, Test Mode, Save changes, and the three lines that confirm setup worked ("Stripe API key is valid", "Signing secret stored.", Stripe Terminal Locations). The admin has to find all of these from text alone, and step 6 packs the mode choice, the save and three checks into one paragraph. The section's only screenshot is the POS Gateways table, with three labels. **Fix:** after step 6, add one numbered screenshot of the gateway settings page with a label on each of those fields and lines.

2. **Set up in WP Admin, step 8 ("Check it worked") · Accuracy signals / Task clarity.** Step 8 says "your smart readers are listed". But the steps never say to register each smart reader in the Stripe Dashboard. That only comes later, under Connect a reader on this till > Smart readers. An admin who follows steps 1–8 and hasn't registered a reader sees "No card readers are set up…" and thinks setup failed. Step 8 also gives a store that only uses Bluetooth readers nothing to check. **Fix:** add a step before "Tick the readers this store allows": "Smart readers: register each one in the Stripe Dashboard with the code the reader shows." Then add one clause to step 8: "Bluetooth only: the Bluetooth readers section shows Connect a reader."

3. **Connect a reader on this till (Card readers screenshot) · Visuals.** The bottom half of the shot is empty. All five labels sit on one row of the screen, so on a phone the shot is too small to read and the labels overlap. The cashier can't match "Use this reader" or "Online" to the screen beside the till. **Fix:** crop the shot to just the Card readers panel (the Smart readers list and its two rows) so it shows at a readable size at phone width. Keep the same five labels.
