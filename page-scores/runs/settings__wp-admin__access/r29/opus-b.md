<!-- page-scores run: doc=settings/wp-admin/access climb=settings__wp-admin__access round=29 judge=opus-b -->
| Category | Staff Permissions | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 8.5 | 8.5 | 8 | 5.5 | 7 |
| Language | 6 | 6 | 8 | 8.5 | 8 | 6.5 | 7 |
| Visuals | 7 | 7 | 8.5 | 8.5 | 8.5 | 3 | 3.5 |
| Structure | 7 | 6.5 | 8.5 | 8.5 | 8 | 6 | 7 |
| Layering | 8 | 7.5 | 8.5 | 8.5 | 8.5 | 6.5 | 5.5 |
| Consistency with approved pages | 8 | 8 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **7.14** | **6.93** | **8.50** | **8.57** | **8.36** | **5.64** | **6.07** |

**1. If something goes wrong › "Checkout failed": task clarity**
This round moved the update history and the AUTH201 log check into the "Why it can start after an update…" fold. That part is fine. The problem is that the visible text also lost the clue that shows the problem on the Access screen. It now says "tick that role's Manage orders box… If the box is already ticked, look for a Deny". But a partly granted box shows a dash, not a tick. A manager who sees a dash can't tell which branch applies to them, and taking payment is the cashier's main job.
**Smallest edit:** after "taking payment needs all of it.", put back one sentence: "Its box shows a dash and a badge such as 3 of 4: tick it to grant the whole task." Then change "If the box is already ticked" to "If the box is fully ticked".

**2. Till permissions › Advanced screenshot: visuals**
Markers 3 and 5 sit on top of the checkboxes for `manage_woocommerce_pos_cash` and `manage_woocommerce_pos_closures`. Those ticks are exactly what the labels describe ("ticked for Cashier", "not ticked for Cashier"), so the reader can't check the label against the picture. On the phone render the same shot shrinks until the ticks are unreadable anyway. The role-list shot has the same fault: marker 4 partly covers "Manage POS settings".
**Smallest edit:** move markers 3 and 5 to the right-hand end of their rows, the way 4 and 6 already sit. Move marker 4 in the first shot clear of the next row's text.

**3. Partly granted tasks › "Restoring defaults can remove permissions another plugin granted": accuracy signals**
The last sentence says: "Anything else on the role is left alone, but one of those goes back to the WCPOS default even if another plugin granted it." "One of those" reads like a typo or a guess. A reader can't tell whether one capability is reset or all of them are, and this warning exists to stop someone from removing permissions by accident.
**Smallest edit:** change "but one of those goes back" to "but each of those capabilities goes back".
