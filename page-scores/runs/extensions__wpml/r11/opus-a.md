<!-- page-scores run: doc=extensions/wpml climb=extensions__wpml round=11 judge=opus-a -->
| Category | WPML (page) | Baseline | Open the Register | Checkout (sell to a guest) | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 6 | 6 | 7.5 | 8 | 8 | 5.5 | 7 |
| Visuals | 6 | 3.5 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| Layering | 7.5 | 7.5 | 9 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 6.5 | 6 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 7 |
| **Average** | **6.93** | **6.43** | **8.57** | **8.79** | **8.57** | **6.00** | **6.21** |

1. **"What the cashier sees" and "Check it works": visuals and consistency.** The two new screenshots are both of WP Admin screens. The only parts of the page that happen in the POS have no picture: the cashier's view, and the press-and-hold on the sync button that brings up **Clear and Refresh**. All three approved pages anchor on a labelled POS shot. Here the cashier gets one paragraph and must picture the sync button from a tiny inline icon. **Smallest fix:** add one Product Panel shot in the approved style under "What the cashier sees", searched for a translated product so it appears once. Label at least: (1) the search field, (2) the single tile, (3) **Showing … of …**, (4) the sync button with its **Clear and Refresh** menu open. Point step 1 of "Check it works" at labels 3 and 4.

2. **Page opening (the "WP admin:" line) and "If something goes wrong": language.** The first thing the cashier reads is a code-font WP Admin path. Then come words a cashier would never say: "WooCommerce Multilingual … version 4.11.0", "the extension switches itself off" and "Default language follows WPML's default". The version requirement is stated three times: in the call-out and in two troubleshooting entries. **Smallest fix:** move the "WP admin:" line below "What the cashier sees". State the 4.11.0 requirement once, in the "Before you start" call-out. Replace the two troubleshooting copies with "see Before you start".

3. **"With WCPOS Pro" and "With the free plugin" screenshots, plus "Choose a store's language": visuals.** On the phone render, the two admin shots shrink until their text can't be read; only the number markers show. The Extensions shot labels only the search field and **Install**. It leaves out the **Active**/**Inactive** state and the **Activate** button that step 2 tells you to look for. "Choose a store's language" also has no shot of the **Store language** picker, though the page warns about two settings called **Language** that are easy to mix up. **Smallest fix:**
   - Crop both shots tighter so they stay readable at phone width.
   - Add a third label on the Extensions card for the status area ("**Active**, or **Inactive** with **Activate**").
   - Add one labelled shot of the store menu showing **Extensions → Language → Store language** beside **Currency & language → Language**, so the difference the tip relies on can be seen.
