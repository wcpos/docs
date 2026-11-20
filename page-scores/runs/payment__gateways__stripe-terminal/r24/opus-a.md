<!-- page-scores run: doc=payment/gateways/stripe-terminal climb=payment__gateways__stripe-terminal round=24 judge=opus-a -->
| Category | Stripe Terminal Gateway (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 9 | 9 | 8.5 | 6 | 8 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Visuals | 6.5 | 6.5 | 9 | 9 | 9 | 3 | 3.5 |
| Structure | 7 | 7 | 9 | 9 | 8.5 | 7.5 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 8 | 5.5 |
| Consistency with approved pages | 8 | 8 | 10 | 10 | 10 | 5 | 5 |
| Accuracy signals | 6.5 | 6.5 | 9 | 9 | 9 | 8 | 8 |
| Admin setup | 8 | 8 | 7.5 | 7 | 7 | 7 | 6 |
| **Average** | **7.3** | **7.3** | **8.9** | **8.8** | **8.6** | **6.4** | **6.4** |

**1. Set up in WP Admin, steps 2–6: Admin setup and Visuals.** The page has no screenshot of the gateway's own settings page (WP Admin > WooCommerce > Settings > Payments > Stripe Terminal). The admin has to find Live Secret Key, Test Secret Key, Terminal location (testing) and (live), POS connections, Test Mode and Save changes from text alone. They also have to recognise the "it worked" lines (*Stripe API key is valid*, *Signing secret stored.*, Stripe Terminal Locations) from text alone. The only admin screenshot is the POS Checkout Gateways table, which covers step 7 only. **Smallest fix:** after step 6, add one shot of that settings page after saving, labelled like the approved pages. Put callouts on each key field and its "How to get this key" line, the two location pickers, the POS connections checkboxes, Test Mode, Save changes, and the green key-valid / signing-secret lines.

**2. Take a payment: Visuals and Task clarity.** The only screenshot shows the moment before sending, with 3 labels. Steps 4–5 have no picture at all. These are the moments the cashier is waiting with a customer in front of them: *Waiting for the customer on the terminal*, the Sent / On terminal / Approved / Captured ticks, **Cancel on terminal**, and *Payment failed: …* with **Try again** and **Choose another way**. The Checkout anchor labels every control the cashier touches (8–9 callouts per shot). **Smallest fix:** add a second labelled shot of the tender pane during a smart-reader payment. Put callouts on the status line, the progress ticks and Cancel on terminal. Add one line or a small inset for the declined state.

**3. Pick your readers, Set up step 4, Tap to Pay, Take a payment step 4: Accuracy signals and Language.** Tap to Pay is a feature that hasn't shipped, and it is still written into the main path in five places. Each one repeats a hedge: "coming… in an app update", "once your app has it", "Once your app has it, it works like this". It even has full UI strings and permission rules. To a cashier this reads as a guess, and it puts a third branch into steps they need now. **Smallest fix:** move the Tap to Pay H3 content into a collapsed block titled "Tap to Pay (coming in an app update)". Remove the "once your app has it" clauses from Set up step 4 and Take a payment step 4. Keep a single link to that block in Pick your readers.
