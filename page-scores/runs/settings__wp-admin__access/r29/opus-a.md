<!-- page-scores run: doc=settings/wp-admin/access climb=settings__wp-admin__access round=29 judge=opus-a -->
| Category | Staff Permissions (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6.5 | 8 |
| Language | 6.5 | 6 | 8 | 8.5 | 8 | 6.5 | 7.5 |
| Visuals | 7 | 7 | 8.5 | 8.5 | 8 | 4 | 4.5 |
| Structure | 7 | 6.5 | 8.5 | 8.5 | 8 | 6.5 | 7.5 |
| Layering | 8.5 | 7.5 | 8 | 8.5 | 8.5 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 8.5 | 4 | 4 |
| Accuracy signals | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **7.4** | **6.9** | **8.4** | **8.6** | **8.3** | **6.0** | **6.4** |

**1. Till permissions: the Advanced screenshot (visuals)**
The whole point of this shot is to show which till permissions are ticked for Cashier, and which aren't. Markers 3 and 5 sit right on top of the checkboxes for `manage_woocommerce_pos_cash` and `manage_woocommerce_pos_closures`. So for two of the four rows the reader can't see if the box is ticked, and has to trust the caption. Markers 4 and 6 sit to the right of their names and don't have this problem.
- **Smallest fix:** move markers 3 and 5 to the right of the capability names, the way 4 and 6 are placed.

**2. "Cashier? You can't change these yourself" call-out (task clarity)**
This call-out is the cashier's only way into the page. It tells them who to ask and which section to point the manager to. It never tells them what to do once the manager has made the change. That instruction ("sign out of the POS and back in") is buried in step 5 of the admin steps, written to the manager. A cashier whose permission has just been granted will still see the button greyed out and think the fix didn't work.
- **Smallest fix:** add one sentence to the end of the call-out: "Once they've changed it, sign out of the POS and back in."

**3. "A user with more than one role", repeated in "If something goes wrong" (accuracy signals)**
The fix says "open that role in the role editor and clear the Deny marks". The page never says which role editor, and there's no Deny control on the Access screen or the Users screen it describes. The page uses *Deny* as the fallback in three places (this section, "no products… load", and "Checkout failed"). Each time, it reads as a guess at a screen the reader can't find.
- **Smallest fix:** say where Deny marks come from the first time they appear, e.g. "the role-editor plugin that set them". Then point the other two mentions at that one sentence.
