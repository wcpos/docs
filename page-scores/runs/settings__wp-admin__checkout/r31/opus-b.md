<!-- page-scores run: doc=settings/wp-admin/checkout climb=settings__wp-admin__checkout round=31 judge=opus-b -->
| Category | Checkout (page) | Baseline | Open the Register | Checkout (j2) | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 6 | 7 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 8 | 8 | 8.5 | 9 | 8.5 | 3 | 3 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 6.5 | 7 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7.5 | 5 |
| Consistency with approved pages | 7.5 | 7 | 9 | 9 | 8.5 | 4 | 4 |
| Accuracy signals | 8 | 8 | 8.5 | 8.5 | 8.5 | 7 | 7 |
| **Average** | **7.64** | **7.5** | **8.5** | **8.71** | **8.5** | **5.71** | **5.71** |

1. **"Choose which payment method comes first": task clarity.** This section asks for two separate settings: the row order (the drag handle) and the payment method picked first (the Default column). Both are buried in body text. The sections around it ("Offer a payment method at the till", "Rename a tile, or round cash totals", "Prevent Overselling") all use numbered steps that end with a reload, but this one has no steps and never says to reload the POS. **Smallest fix:** turn the first two sentences into numbered steps: "1. Drag the row by its handle to where you want its tile. 2. In the **Default** column, pick the payment method checkout should open on. 3. Reload the POS on each till." Keep the sentences about what happens when the default can't be used after the steps.

2. **"Payment Gateways" → FREE VS PRO call-out: consistency and structure.** This round moved the Pro note in "Offer a payment method at the till" into a blue **WITH WCPOS PRO** call-out, which matches the approved pages. But a few lines above it, the free-versus-Pro limit is still a grey info note headed **FREE VS PRO**. That puts two Pro call-outs in two styles in the same section, so a reader can't learn "blue box = Pro" at a glance. The new call-out also writes the menu path *WP Admin > POS > Settings > Extensions* in bold, while every other menu path on the page uses code style. **Smallest fix:** change the FREE VS PRO admonition to the same WITH WCPOS PRO type and keep its text as it is. Put the Extensions path in code style like the others.

3. **"Payment Gateways" table screenshot: visuals (worst at phone width).** At phone width, marker 2 covers the word "Cash" (it reads "ash"), and the table text is too small to read. On desktop, marker 1 sits on the header row rather than on a drag handle, so "Drag handle" points at a column title instead of the control. **Smallest fix:** move marker 1 onto the Cash row's handle and marker 2 onto the Default radio button so it no longer covers the name. Crop out the Gateway ID column so the rest renders larger on a phone.
