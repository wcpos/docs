<!-- page-scores run: doc=settings/wp-admin/general climb=settings__wp-admin__general round=14 judge=opus-b -->
| Category | General (page) | Baseline | j1 Open the Register | j2 Checkout | j12 Product Panel | Square: Build cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 9 | 8 | 6.5 | 8 |
| Language | 7 | 7 | 8 | 8.5 | 8 | 6.5 | 7.5 |
| Visuals | 7 | 7 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Layering | 8.5 | 8 | 8.5 | 8.5 | 9 | 7.5 | 6 |
| Consistency with approved pages | 8 | 7.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.57** | **7.29** | **8.57** | **8.71** | **8.43** | **6.14** | **6.36** |

1. **Register: Visuals / Structure.** The only screenshot in this section shows the Pro "Site defaults" view: no Opening float, with Manage stores at the bottom. The free-plugin layout, which most readers will see, is described only in a loose sentence ("On the free plugin, Opening float sits under…") with no picture. So the reader has to work out how the shot differs from their own screen, and the Opening float, which is the first setting the section names, isn't labelled anywhere. **Smallest fix:** use a free-plugin shot of the Register block as the main image, labelled Open and close the register, Opening float, Ask a manager, Remind the cashier to close, and More registers and stores with Pro. Keep the Pro differences in the existing "With WCPOS Pro" call-out and drop the "On the free plugin…" sentence.

2. **Register, label 2: Accuracy signals.** The new text says: "The screen's hint says a manager's code; in the POS the manager approves by signing in with their WordPress username and password." This puts a contradiction inside a label. It reads as the docs disagreeing with the product, and a cashier with a manager standing beside them won't know which one to trust. j1 states only the sign-in method. **Smallest fix:** cut the label to "a count short or over by more than this needs a manager to sign in with their WordPress username and password before the register closes; see When the count is out." The out-of-date hint text belongs in a bug report, not on this page.

3. **Customers: Visuals.** This section has five settings, including two that depend on each other (Default POS customer is greyed out while Use cashier account is ticked), and the per-device copy that the new troubleshooting entry relies on. Yet it is the only main section on the page without a labelled shot. Store details, Register, Products and Privacy each have one, and so do the matching sections of the approved pages. As a result, the cashier can't see what "greyed out" looks like or where Receipt template for customers appears. **Smallest fix:** add one numbered shot of the Customers block with Use cashier account ticked, so the greyed-out dropdown shows. Label the five settings in the same style as the Products shot, and link each label to its subsection with "See below."
