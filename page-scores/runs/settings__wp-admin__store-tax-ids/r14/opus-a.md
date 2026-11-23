<!-- page-scores run: doc=settings/wp-admin/store-tax-ids climb=settings__wp-admin__store-tax-ids round=14 judge=opus-a -->
| Category | Store Tax IDs | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 7 | 7 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 7 | 6.5 | 8.5 | 9 | 8.5 | 7.5 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 8 | 5 |
| Consistency with approved pages | 7 | 7 | 9.5 | 9.5 | 9.5 | 4 | 4 |
| Accuracy signals | 6.5 | 6.5 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| **Average** | **7.14** | **6.93** | **8.71** | **9.00** | **8.64** | **5.93** | **5.93** |

1. **Intro and "Which numbers a store prints" (Pro), accuracy signals.** The intro says that once a Pro store exists, **General** "lists your stores instead of **Store details**". That means the **Store tax IDs** list is no longer where step 1 sends you. But the Pro section and "A store prints the wrong number" both say a store with no numbers of its own prints "the site's **Store tax IDs**". The reader can't tell where that site list is now edited, or if it still can be. That reads as a contradiction. **Smallest fix:** add one sentence to the intro paragraph saying where the site-wide **Store tax IDs** list lives once a store exists. If it can no longer be edited, say that instead.

2. **"Add a tax number" screenshot, visuals.** On the row, the columns run Type, Value, Country, but the badges read 2, 4, 3 from left to right. The legend follows the badge numbers, so it doesn't match the screen order either. The badges also sit on top of the column headers. At phone width this cuts them to "TYP", "VALU" and "COUNTR", which hides the labels the cashier needs to match. **Smallest fix:** number the badges in column order (Type 2, Value 3, Country 4, Custom label 5, Remove 6), reorder the legend to match, and move each badge just beside its header instead of over it.

3. **"Add a tax number" steps and the "Enter a value to keep the row" warning, structure.** The warning comes after all six steps, the screenshot and the legend. It only appears once the reader has already acted. Step 3 already says the same thing ("Nothing on the new row saves until Value has a number"), so the warning box repeats body text instead of warning in time. The page also opens with a monospace "WP admin: …" line that the next sentence repeats word for word. None of the approved pages has a line like that. **Smallest fix:** move the warning so it sits directly above step 3, delete the matching sentence from step 3, and delete the monospace "WP admin:" line.
