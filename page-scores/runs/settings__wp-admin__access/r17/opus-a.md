<!-- page-scores run: doc=settings/wp-admin/access climb=settings__wp-admin__access round=17 judge=opus-a -->
| Category | Open the Register (j1) | Checkout (j2) | Product Panel (j12) | Square: Build your customer's cart | Shopify: Processing a sale | Staff Permissions (page) | Baseline |
|---|---|---|---|---|---|---|---|
| Task clarity | 9 | 9 | 8.5 | 6 | 7.5 | 7.5 | 7.5 |
| Language | 8.5 | 8.5 | 8.5 | 6 | 7 | 6.5 | 6.5 |
| Visuals | 9 | 9 | 9 | 3 | 4 | 8.5 | 8.5 |
| Structure | 9 | 9 | 8.5 | 6.5 | 7.5 | 7.5 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 7 | 5 | 8.5 | 8.5 |
| Consistency with approved pages | 10 | 10 | 10 | 3 | 3 | 8 | 8 |
| Accuracy signals | 9 | 9 | 9 | 7.5 | 7.5 | 8.5 | 8 |
| **Average** | **9.0** | **9.0** | **8.9** | **5.6** | **5.9** | **7.9** | **7.8** |

1. **"Change what a role can do", step 5 (task clarity / structure).** In the new wording, the thing the reader has to do ("Ask anyone signed in with that role to sign out of the POS and back in") comes after the explanation, so it's the last thing read in the step. In the approved pages, a step starts with what you do (for example "Press Close & print. The closure is written…"). The baseline did start with the action, but its explanation ("The store applies them at once") was vaguer. **Smallest fix:** put the action first and keep the new explanation: "Ask anyone signed in with that role to sign out of the POS and back in. The store enforces the change straight away, but the POS screens only show it after a sign-in."

2. **"When a cashier sees 'You don't have permission'" (structure / accuracy signals).** The new line "A shop manager can grant it too." fixes the quoted message, which names only an administrator. That matches the page's own statement that Shop Manager has Manage POS settings. But the line is on its own between the quote and the list it introduces, so a cashier scanning from the message to the "tick this task" list reads past a loose sentence. **Smallest fix:** delete the separate line and put the fact in the sentence before the quote: "…and its tooltip tells the cashier who can fix it (an administrator or a shop manager):".

3. **"If something goes wrong" and "What each default role can do, at a glance" (language).** Body text uses words a cashier would never say: "Manage POS settings and `read`" (a raw capability name shown in code style), "For which store request each role may make", and a Related link titled only "AUTH201". The approved pages keep capability names inside labelled screenshots and never put them in body text or link titles. **Smallest fix:** cut "and `read`". Reword the other line to "To see which parts of your store each role can reach, see Role Endpoint Access". Rename the link to the message the cashier actually sees, keeping "AUTH201" only in its description.
