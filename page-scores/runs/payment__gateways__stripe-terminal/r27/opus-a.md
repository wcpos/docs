<!-- page-scores run: doc=payment/gateways/stripe-terminal climb=payment__gateways__stripe-terminal round=27 judge=opus-a -->
| Category | Stripe Terminal (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6 | 7 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6.5 | 7 |
| Visuals | 7.5 | 6.5 | 9 | 9 | 9 | 3 | 3 |
| Structure | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6.5 | 7 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7.5 | 5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Admin setup | 8.5 | 7.5 | 7.5 | 7 | 6 | 6 | 4 |
| **Average** | **7.6** | **7.4** | **8.4** | **8.4** | **8.2** | **5.8** | **5.6** |

**Findings**

1. **Set up in WP Admin, steps 4–6 (Visuals / Admin setup).** The new settings screenshot (POS connections, Terminal locations, Test Mode) sits after step 6's "Then check the page" list. That puts it a full screen below steps 4 and 5, the steps it shows. It also shows the opposite of a finished setup: both location boxes still read *Select a location*, Test Mode is ticked, and there's a yellow warning that Test Mode is forced on when the site has no SSL. None of the three success lines that step 6 tells the admin to look for appear in it. As a result, the admin has nothing to compare against to tell whether setup worked. **Smallest fix:** move the shot up to sit right after step 5. Then retake it, or add a small crop, showing a saved page with the locations chosen, *Stripe API key is valid* and *Signing secret stored*. Label those two lines so they can be ticked off.

2. **Set up in WP Admin, step 3 key screenshot (Visuals).** Two of the shot's three labels go on empty key fields. Label 2 points at the plugin's own *How to get this key* paragraph, which repeats the bullets directly above it. On a phone that paragraph is unreadable (`page-phone-03.png`). The shot also doesn't show what a pasted key looks like: the dots and *(saved; leave blank to keep)*. **Smallest fix:** retake it after a key is saved and point the labels at the saved field and the line under it. Then drop label 2, or crop the paragraph down to its link to the Stripe Dashboard API keys page.

3. **Phone orders (MOTO), and Related Documentation (Consistency / Language).** The approved Checkout page calls this tab the **Store checkout tab (WCPOS Pro)** and links to *The Store checkout tab*. This page only calls it **Legacy** and links to *The Legacy Tab*. A cashier who learned the approved term won't connect the two, and the page also uses internal words like *Captured*, *webhook* and *Signing secret*. **Smallest fix:** at the first mention, write "the **Store checkout** tab (labelled **Legacy** on screen)". Point the Related Documentation link at The Store checkout tab, the same target the Checkout page uses.
