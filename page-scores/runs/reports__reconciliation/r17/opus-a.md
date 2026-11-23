<!-- page-scores run: doc=reports/reconciliation climb=reports__reconciliation round=17 judge=opus-a -->
## Scores

| Category | Closure Reports | Baseline | Open the Register (J1) | Checkout (J2) | Product Panel (J12) | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 8.5 | 8 | 6.5 | 7.5 |
| Language | 6 | 6 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 3 | 3 |
| Structure | 7 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7 |
| Layering | 8 | 8 | 8.5 | 8.5 | 8.5 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 8.5 | 4 | 4 |
| Accuracy signals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.0** | **6.9** | **8.5** | **8.6** | **8.4** | **5.9** | **5.9** |

## Highest-leverage findings

**1. Variance handling, step 1 and "Recount a closure": accuracy signals / layering.**
- **What's wrong:** The page says early on that recounts need WCPOS Pro. But step 1 of Variance handling tells the cashier "a manager can still recount the closure in Reports" with no Pro caveat. The "Recount a closure" section doesn't mark it as Pro either, even though "Export closures" does ("From the POS (Pro)"). A cashier on the free plugin will be sent to a button they don't have.
- **Smallest fix:** In step 1, change it to "With Pro, a manager can still recount the closure in Reports". Open "Recount a closure" with one line: "Needs WCPOS Pro."

**2. "Open the register" and Variance handling, step 4: language.**
- **What's wrong:** "(REGISTER221)" and "(see REGISTER101)" are internal reference codes used as link text. A cashier would never say these out loud, and they don't say where the link goes. The approved pages link by page name, e.g. "See Stores, Registers and Devices" in J1.
- **Smallest fix:**
  - Replace "(REGISTER221)" with "See Stores, Registers and Devices."
  - Replace "(see REGISTER101)" with "see Open the Register: If something goes wrong."

**3. "Read a closure" screenshot: visuals.**
- **What's wrong:** The shot labels Counted, Expected, Variance, Note, Drawer and the buttons. It doesn't label the two things the example was chosen to show: the yellow "Recorded $3,162.50 · −$2.50 short … Settled at …" banner and the "Late corrections 1 … $25.00" drawer line. A whole paragraph below the legend explains them with nothing on the image to point at. There's also a mismatch: the banner in the shot reads "Settled at $3,162.50", while the prose says the closure "now reads $27.50 short".
- **Smallest fix:**
  - Add callout 7 on the banner: "Correction note: what was recorded at the close and where it settled."
  - Add callout 8 on the Late corrections row: "Late corrections: sales, refunds or movements that arrived after the count."
  - Shorten the paragraph to the worked example. Make its wording match what the banner actually says.
