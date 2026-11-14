<!-- page-scores run: doc=payment/gateways/stripe-terminal climb=payment__gateways__stripe-terminal round=24 judge=opus-b -->
| Category | Stripe Terminal Gateway | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 7 | 7 | 8.5 | 8.5 | 8.5 | 6.5 | 7.5 |
| Visuals | 6.5 | 6.5 | 9 | 9 | 9 | 3 | 3 |
| Structure | 7 | 7 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 8 | 10 | 10 | 10 | 5 | 5 |
| Accuracy signals | 7.5 | 7.5 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 7.5 | 7.5 | 8 | 7.5 | 7.5 | 6 | 4 |
| **Average** | **7.44** | **7.44** | **8.88** | **8.88** | **8.75** | **6.19** | **6.00** |

1. **Set up in WP Admin, steps 2–6 · Visuals / Admin setup.** Steps 3 to 6 all happen on the gateway's settings page (WooCommerce > Settings > Payments > Stripe Terminal), but the page has no screenshot of it. The only shot in this section is the POS Checkout gateways table from step 7. So the admin has to find these by text alone: the Live and Test Secret Key fields, the "Stripe API key is valid" line, the two Terminal location menus, the POS connections ticks, the "Signing secret stored." row and Save changes. **Smallest fix:** add one annotated shot of that settings page after step 2, with about seven numbered labels for those items. Step 6 can then point to the labels.

2. **Set up in WP Admin, step 7 (Gateways table shot) · Visuals.** The shot shows all 12 gateway rows, and the Stripe Terminal row is at the very bottom, cut off at the lower edge. At phone width the whole table shrinks until it can't be read, and label 2 covers the start of "Stripe Terminal". Eleven of the twelve rows are noise, and the one row that matters is the hardest to read. **Smallest fix:** crop the shot to the table header plus the Stripe Terminal row, or zoom in on that row, and keep the three labels.

3. **Set up in WP Admin, steps 3 and 8 · Task clarity / Admin setup.** Step 3 has the admin paste both a live key and a test key. Step 8 says "run a test sale". But no setup step tells them to tick or check **Test Mode**. That instruction only appears later, in a separate section (Test before you go live). An admin who follows steps 1–8 can't tell which mode the gateway is in, so the "test sale" may charge a real card. **Smallest fix:** add one sentence to step 6: "To try it first, tick **Test Mode** before you save; see Test before you go live."
