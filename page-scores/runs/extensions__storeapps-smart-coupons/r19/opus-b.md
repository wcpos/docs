<!-- page-scores run: doc=extensions/storeapps-smart-coupons climb=extensions__storeapps-smart-coupons round=19 judge=opus-b -->
| Category | Smart Coupons (page) | Baseline | J1 Open the Register | J2 Checkout | J12 Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 5 | 5 | 7.5 | 8 | 7.5 | 6.5 | 7 |
| Visuals | 3 | 3 | 9 | 9 | 8.5 | 4 | 4.5 |
| Structure | 6 | 6 | 8.5 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 7.5 | 7.5 | 8.5 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 5.5 | 5.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 5.5 | 5.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **5.6** | **5.6** | **8.5** | **8.8** | **8.5** | **6.1** | **6.4** |

The page under review and `baseline/` are the same, word for word and in both renders, so they get the same scores.

1. **Take a gift card at the till · Visuals.** This section has no screenshot at all. Every approved page puts a numbered, labelled shot on each task step. Here the cashier has to find **Coupon code**, **Apply coupon**, the payment method and **Charge** on a payment page they have never seen. **Smallest fix:** add one screenshot of the payment page with the card applied, in the J2 style, with labels at least for: the tab, Coupon code, Apply coupon, the coupon's discount line, the new total, the payment method and Charge. Add a second shot of the receipt row in place of the plain-text quote under *What the receipt shows*.

2. **Take a gift card at the till / With WCPOS Pro call-out · Consistency and accuracy.** The page calls the tab **Store checkout**. The approved Checkout page (J2) calls what looks like the same tab the **Legacy tab (WCPOS Pro)**, with "gateways that run on their own payment page". The page also says Pro is needed only in the intro and in a call-out at the very bottom. The steps never say it, and the install section offers a free-plugin route without saying whether a free-plugin till can take a gift card at all. **Smallest fix:** use J2's tab name, or say plainly that it is the same tab. Move the Pro requirement into the "Before you start" sentence. Add one sentence saying what the extension does without Pro.

3. **Whole page, from *What it does* to *Refunds and cancellations* · Language and structure.** Words like StoreApps, extension, "private note", WP Admin → Marketing → Coupons, receipt template and "coupon description" are admin and plugin language a cashier wouldn't use. They sit in the main body, between the task and *If something goes wrong*, so the cashier has to scroll past four admin sections to reach the troubleshooting. **Smallest fix:** move *If something goes wrong* to just after *What the receipt shows*. Group *What it does*, *Install the extension*, *The note on the order* and *Refunds and cancellations* under one heading, such as "For the store administrator", or fold them into a collapsible section like the existing install one. Keep all of that content; only move it.
