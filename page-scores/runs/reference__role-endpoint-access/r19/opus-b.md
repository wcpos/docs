<!-- page-scores run: doc=reference/role-endpoint-access climb=reference__role-endpoint-access round=19 judge=opus-b -->
| Category | Role Endpoint Access (page) | Baseline | Open the Register | Checkout (sell to a guest) | Product Panel (find a product) | Square: Build your customer's cart | Shopify: Quick reference, processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 9 | 9 | 8.5 | 6 | 7 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 4.5 | 4.5 | 9 | 9 | 8.5 | 4.5 | 4 |
| Structure | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 6 | 7 |
| Layering | 8 | 7.5 | 9 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 6 | 6 | 9 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 7 | 7 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| **Average** | **6.7** | **6.6** | **8.7** | **8.9** | **8.6** | **5.8** | **6.1** |

1. **"Ask an administrator to check the role (AUTH201)", task clarity / layering.** This round added a new way for a payment to be refused: since 2.0.6, a role without the right to edit an order can't take payment on another cashier's order or an online-shop order, and gets 403. That rule only appears in the "Free Plugin Endpoint Access Matrix" paragraph, after the line "Cashiers can stop reading here". So the cashier who hits it gets no help, and the cashier section doesn't link to the explanation. **Smallest fix:** add one sentence to the AUTH201 section: "If **Take** is refused on another cashier's sale or an online order, your role can't change that order. Ask your site administrator, and send them the [Free Plugin Endpoint Access Matrix](#free-plugin-endpoint-access-matrix)."

2. **"Free Plugin Endpoint Access Matrix", accuracy signals.** The new paragraph says a role without these rights "gets 403", but it doesn't say which code the app then shows. A 403 should be AUTH201, so the page reads as if it's guessing about what the cashier sees. The paragraph also opens with "Every default role … can reach the routes a sale uses" and then adds a condition under which taking payment fails, which reads as a contradiction on first pass. **Smallest fix:** change "A role without them gets `403`" to "A role without them gets `403`, and the app shows AUTH201". Then change the opening clause to "can reach the routes a sale uses, payment included".

3. **"Sign in again (AUTH101)" and "Update the app (SYNC341)", visuals.** The page has no screenshots. The cashier has to match the wording of a message ("Request still unauthorized after token refresh…", "Please log in to continue", "Update the POS app on this device.") and find a **Log in** button from text alone. The approved pages show every screen the cashier acts on, with numbered labels. **Smallest fix:** add one labelled shot per fix section, in the approved-page style: the AUTH101 message with **Log in** marked (1), and the SYNC341 message with its text marked (1). Put each one right after the "The app says…" line.
