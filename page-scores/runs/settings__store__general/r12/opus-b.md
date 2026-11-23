<!-- page-scores run: doc=settings/store/general climb=settings__store__general round=12 judge=opus-b -->
## Scores

| Category | Store Defaults (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 7 | 7.5 | 7.5 | 6.5 | 7 |
| Visuals | 7.5 | 7 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8 | 7 | 6.5 |
| Layering | 8 | 8 | 8.5 | 8.5 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **7.4** | **7.2** | **8.4** | **8.6** | **8.4** | **6.1** | **6.0** |

## Highest-leverage findings

1. **Store address: structure.** The new sentence about needing a WP Admin login is plain text squeezed between "To change the address:" and step 1, so it reads as part of the steps. The approved pages put a requirement like this in a call-out ("THIS PAGE NEEDS THE REGISTER SWITCHED ON", "OPEN THE REGISTER FIRST"). The section also ends after the WCPOS Pro call-out with a loose sentence: "A store with no city set shows a dash…" now repeats label 2 of the WooCommerce shot, and the phone note is cut off from the shot it describes.
   **Smallest edit:** Turn the login sentence into an info call-out, for example "STEPS 1 AND 2 NEED A WP ADMIN LOGIN". Delete the "no city set shows a dash" sentence, and move "On a phone, Set in WooCommerce and Open sit under each value" up under the General page legend.

2. **The General page: visuals.** The **Default Customer is Cashier** switch is in the shot without a label, then explained in a separate paragraph under the legend. This is a setting a cashier would actually change. The approved pages label every control the text talks about and don't explain controls in prose after the legend.
   **Smallest edit:** Add label 7 on the switch: "Default Customer is Cashier — starts every new cart with the cashier who is signed in. See Default customer." Then cut the paragraph down to its pointer to Currency & numbers and Restore Server Settings.

3. **Page title and the side menu: consistency and accuracy.** The H1 and breadcrumb say **Store Defaults**. The body, the app and the troubleshooting all call this page **General**. The side menu also lists a separate "General" page as its sibling, which is the "Next »" link. A cashier who opens Settings → General can't tell which page matches their screen. Every approved page takes its title from what's on screen ("Open the Register", "Checkout", "Product Panel").
   **Smallest edit:** Rename the H1 and menu entry to "General", or "General settings" if the other "General" page has to keep its name.
