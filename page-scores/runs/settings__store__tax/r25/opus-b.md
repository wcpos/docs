<!-- page-scores run: doc=settings/store/tax climb=settings__store__tax round=25 judge=opus-b -->
## 1. Scores

| Category | POS Tax | Baseline | J1 Open the Register | J2 Checkout | J12 Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 9 | 9.5 | 8.5 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8.5 | 6 | 7 |
| Visuals | 7.5 | 7.5 | 9 | 9 | 9 | 3 | 3.5 |
| Structure | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 8 | 7.5 | 9 | 8.5 | 9.5 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 8 | 10 | 10 | 10 | 4 | 4.5 |
| Accuracy signals | 7 | 7 | 9 | 9 | 9 | 7.5 | 7 |
| **Average** | **7.4** | **7.3** | **9.1** | **9.1** | **9.0** | **5.9** | **6.1** |

## 2. Highest-leverage findings (POS Tax)

**1. Which rates apply to this sale, and "The wrong rate" in If something goes wrong (accuracy signals / visuals)**
- **What's wrong:** Both places tell the cashier to press "the tax address button, such as **Shop address**". In the screenshot, though, that button reads **Shop base ⌄**. "Shop address" is actually the name of a heading *inside* the popover (label 3). So the cashier is sent looking for a button that doesn't exist. The screenshot also has no label on the button that opens the popover, which is the one control this section needs them to find.
- **Smallest fix:** Change "such as Shop address" to "such as **Shop base**" in both places. Add a sixth label on the **Shop base** button at the bottom of the shot, captioned "Tax address button: press it to open this."

**2. Set in WooCommerce, the paragraph added this round (structure / layering)**
- **What's wrong:** The new paragraph says each product is taxed at the rates of its own tax class, chosen on the product or, with Pro, on Products. It's the only new content compared with Baseline, and it's useful. But it sits after a collapsed block in a section about four greyed-out rows, where nobody looking for it will find it. The two places that need it don't point to it: step 3 of "No tax on a sale" ("Its tax class has rates") and "The wrong rate" never say where a product's tax class is set.
- **Smallest fix:** Move the paragraph to open "Check the tax rates". Then add to step 3 of "No tax on a sale": "(the class is set on the product; see Check the tax rates)".

**3. Restore server settings, first screenshot (visuals)**
- **What's wrong:** The shot is the whole General page, but both labelled items (Restore Server Settings and Try again) are in a thin strip at the bottom. At phone width that strip is a few pixels tall and can't be read. A cashier with the page open beside the till can't see what the button looks like or where it is.
- **Smallest fix:** Crop the shot to the bottom strip ("Copied from your WooCommerce store…", Restore Server Settings, Couldn't reach the store, Try again). Keep labels 1 and 2 as they are.
