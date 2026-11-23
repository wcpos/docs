<!-- page-scores run: doc=settings/wp-admin/registers climb=settings__wp-admin__registers round=22 judge=opus-a -->
I compared the three approved pages, the two other products' pages and the baseline, then scored them all. Here is the report.

| Category | Register Settings (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 7 | 7.5 |
| Visuals | 8.5 | 7 | 9 | 9 | 8.5 | 4 | 4 |
| Structure | 7.5 | 6.5 | 9 | 9 | 8.5 | 7 | 7 |
| Layering | 7.5 | 8 | 9 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 7.5 | 9.5 | 9.5 | 9.5 | 4 | 4 |
| Accuracy signals | 7 | 7.5 | 9 | 9 | 9 | 8 | 8 |
| **Average** | **7.5** | **7.1** | **8.9** | **9.0** | **8.7** | **6.3** | **6.2** |

## Three highest-leverage findings

**1. Turn the register on, label 3 on the settings screenshot · Accuracy signals**
- **What's wrong:** The label says "The screen's hint says a manager's code; in the POS the manager approves by signing in with their WordPress username and password." The page openly disagrees with the screen it shows, and the reader can't tell which is right. The approved page *Open the Register* only describes the sign-in. This sentence is new since the baseline, and it is the main reason the page scores lower than the baseline on accuracy.
- **Smallest fix:** Cut the sentence to "…a manager must approve it, by signing in with their WordPress username and password; see When the count is out." The wrong on-screen hint should be raised as a product bug, not explained on the page.

**2. Turn the register on, opening paragraph · Layering**
- **What's wrong:** The baseline began this section with "With Pro and at least one store, these settings become site defaults and each register's float moves to its store." That line is gone. Now the only place that says a store can override these rules is the troubleshooting entry "Cashiers never see Overdue." A manager with Pro stores can change General settings and see no effect, with nothing near the steps to explain why.
- **Smallest fix:** Add one sentence after step 5: "With Pro stores, these are defaults: a store that sets its own Cash drawer rules ignores them (see A store's Registers page)."

**3. Turn the register on, steps vs. screenshot labels · Visuals / Structure**
- **What's wrong:** The new settings screenshot is a real gain over the baseline. But the five steps are numbered 1–5 and the four red labels are numbered 1–4, and they don't line up. Step 2 is label 1, step 3 is label 2, and so on. On a phone the shot sits below all the steps, so a reader at "3. Check the Opening float" looks for label 3 and lands on the manager-approval setting.
- **Smallest fix:** Name the label in each step that points at a setting, e.g. "Turn on **Open and close the register** (label 1)" and "Check the **Opening float** (label 2)". Do the same for the two optional steps (labels 3 and 4). Step 1 has no label.
