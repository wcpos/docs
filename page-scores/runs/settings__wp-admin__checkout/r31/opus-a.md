<!-- page-scores run: doc=settings/wp-admin/checkout climb=settings__wp-admin__checkout round=31 judge=opus-a -->
| Category | Checkout (settings) | Baseline | j1 Open the Register | j2 Checkout (sell to a guest) | j12 Product Panel | Square: Build your customer's cart | Shopify: Quick reference, processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 8.5 | 9 | 8.5 | 6 | 8 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6.5 | 7.5 |
| Visuals | 8 | 8 | 8.5 | 8.5 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 8 | 8.5 | 8.5 | 7.5 | 6 |
| Consistency with approved pages | 7.5 | 7 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.5** | **7.4** | **8.4** | **8.6** | **8.4** | **5.9** | **6.3** |

1. **"Choose which payment method comes first", task clarity.** The section covers two separate jobs: dragging rows to set the tile order, and picking the Default. Only the first has a step you can follow. Picking the Default is buried in the middle of a four-sentence paragraph with no step, even though the "If something goes wrong" section points readers here ("Choose the one you want in the Default column"). **Smallest fix:** under the drag sentence, add a two-step list: "1. In the **Default** column, pick the circle beside the payment method. 2. Reload the POS on each till." Then cut the paragraph down to the fallback rule ("If it has no tile… the first tile that can be used is picked").

2. **"Payment Gateways" intro, accuracy signals.** It says the table lists "every one installed on your site". Three other places on the page ("Offer a payment method" before-you-start, the NOTE under "POS vs Online Store", and the first "If something goes wrong" entry) say a payment method shows only once its plugin is installed **and active**. That reads as a contradiction, and an owner holding an inactive plugin will expect to see it in the table. **Smallest fix:** change "every one installed on your site" to "every one whose plugin is active on your site".

3. **Payment Gateways table and its labels, language.** The page says it will call these "payment methods" ("which WooCommerce calls gateways"), then keeps switching back to "gateway" in the labels and body: "A switched-off gateway", "the gateway's POS settings", "a tile for each gateway you switched on", "the gateway's Order Status". The table screenshot also shows the unlabelled Gateway ID slugs (`pos_cash`, `bacs`, `stripe_terminal_for_wooc…`), and nothing on the page tells the reader to ignore them. **Smallest fix:** in callout labels 5 and 6 of the table shot and in labels 1 and 8 of the tender-pane shot, replace "gateway" with "payment method". Keep "Gateways" only where it names the on-screen table. Add one clause to the "Gateway table columns" lead-in: "(Gateway ID is for developers; you can ignore it)".
