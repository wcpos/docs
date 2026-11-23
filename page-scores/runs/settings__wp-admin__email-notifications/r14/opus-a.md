<!-- page-scores run: doc=settings/wp-admin/email-notifications climb=settings__wp-admin__email-notifications round=14 judge=opus-a -->
| Category | Email Notifications (page) | Baseline | j1 Open the Register | j2 Checkout | j12 Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 9 | 8 | 7 | 8 |
| Language | 5.5 | 5.5 | 8 | 8.5 | 8 | 7 | 7.5 |
| Visuals | 6 | 6 | 9 | 9 | 9 | 3 | 3 |
| Structure | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 7 | 8 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 8 | 6 |
| Consistency with approved pages | 7 | 7 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **6.93** | **6.86** | **8.57** | **8.71** | **8.50** | **6.21** | **6.29** |

1. **Top of page, before "Turn emails on or off" (language and structure).** The approved pages start from what the cashier does, and their opening call-out says what the page depends on. This page starts with a WP Admin path, then a call-out about overriding WooCommerce settings. The one thing a cashier can do here is send a receipt from the till. That is "Send a receipt manually", tucked inside "Customer emails" and fifth in the "Go straight to" list. A cashier who opens this page because "the customer didn't get an email" has to read through admin settings, order statuses and recipient lists before finding their own action. **Smallest edit:** add one call-out right under the intro, shaped like j1's "THIS PAGE NEEDS…" box. Something like: "AT THE TILL? These settings are for the store manager. To email a customer their receipt now, press Email Receipt on the paid screen: see Email the receipt."

2. **"Turn emails on or off", the settings screenshot (visuals).** The screenshot is mostly empty space on its right side. At phone width it shrinks until the checkbox names ("Order on hold", "Processing order"…) are about 4 px tall and can't be read (page-phone-02). Only the three switches are numbered, so the nine checkboxes that steps 3 and 4 talk about have no labels. The approved pages' screenshots stay readable on a phone. **Smallest edit:** crop the screenshot to the left column of switches and checkboxes so it stays full-size on a phone. Then add one label on a checkbox row: "Untick to stop just this email".

3. **"Turn emails on or off", the "What one sale paid at the till sends" diagram (visuals and task clarity).** The diagram only shows the Completed case, where everything works. Its three numbered labels repeat what the screenshot labels just above already said. The case that actually confuses people is left out: a payment method that ends in Processing or On hold, where the customer gets nothing. That case is only explained further down, in a dense paragraph after the "Emails sent automatically" table and again in "If something goes wrong". **Smallest edit:** add a second branch to the diagram: "Order Status Processing or On hold → New order only → customer gets no email → use Email Receipt". Then the diagram shows something the text doesn't.
