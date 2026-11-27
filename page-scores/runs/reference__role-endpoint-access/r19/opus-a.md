<!-- page-scores run: doc=reference/role-endpoint-access climb=reference__role-endpoint-access round=19 judge=opus-a -->
| Category | Role Endpoint Access (page) | Baseline | j1 Open the Register | j2 Checkout | j12 Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 8 |
| Language | 6.5 | 6.5 | 8.5 | 8.5 | 8.5 | 7 | 8 |
| Visuals | 3.5 | 3.5 | 9 | 9 | 9 | 4 | 4 |
| Structure | 6.5 | 6.5 | 9 | 9 | 8.5 | 6.5 | 8 |
| Layering | 7.5 | 7.5 | 9 | 9 | 9 | 7.5 | 6.5 |
| Consistency with approved pages | 5.5 | 5.5 | 9.5 | 9.5 | 9 | 5 | 5.5 |
| Accuracy signals | 7.5 | 7 | 9 | 9 | 9 | 7.5 | 7.5 |
| **Average** | **6.36** | **6.29** | **9.00** | **9.00** | **8.79** | **6.29** | **6.79** |

1. **"Ask an administrator to check the role (AUTH201)", layering and task clarity.** This round added one fact to the "Free Plugin Endpoint Access Matrix" paragraph: since 2.0.6, taking payment can be refused with a 403 even though the cashier can still sign in. That is the case a cashier is most likely to hit at the till. But it only appears in the admin half, written in capability names (`edit_shop_orders`, `edit_others_shop_orders`). The AUTH201 section the cashier reads says nothing about it, and nothing links to it. **Smallest fix:** add one sentence to AUTH201: "If it's taking payment that's refused, tell them your role needs to be able to edit orders, including other cashiers' orders." Link "edit orders" to the Free Plugin Endpoint Access Matrix section.

2. **The whole cashier half (AUTH101, AUTH201, SYNC341), visuals.** The page has no images at all. The cashier is asked to "find the code in the app's message", but they never see what that message looks like or where the code and the **Log in** button sit. All three approved pages show a numbered screenshot for each step. **Smallest fix:** add one numbered screenshot per code, in the same style as the approved pages:
   - AUTH101: the "Please log in to continue" message, with labels on the code and the **Log in** button.
   - AUTH201: the refused-action notice, with a label on the code.
   - SYNC341: the "Update the POS app on this device" screen, with a label on the code.

3. **"Permission failure vs. token failure" and the "Diagnosing Failures" heading, language and consistency.** This section sits above the "Cashiers can stop reading here" line. It repeats what AUTH101 and AUTH201 already say, and it uses words a cashier wouldn't say ("token", "the user"). The heading above it is in Title Case, and its name doesn't match "If something goes wrong", which the approved pages use for this kind of section. **Smallest fix:**
   - Move "Permission failure vs. token failure" and its "How to tell them apart" block below "For administrators and developers".
   - Rename "Diagnosing Failures" to "If something goes wrong".
