<!-- page-scores run: doc=settings/wp-admin/email-notifications climb=settings__wp-admin__email-notifications round=14 judge=opus-b -->
Status: I've compared all five anchors against the page and the baseline. Here is the scoring.

| Category | Email Notifications | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 5.5 | 5.5 | 8.5 | 9 | 8 | 6 | 7.5 |
| Language | 4.5 | 4.5 | 7.5 | 8 | 7.5 | 6 | 7 |
| Visuals | 6 | 6 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 6.5 | 6.5 | 8.5 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 7.5 | 7.5 | 9 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 5.5 | 5.5 | 9.5 | 9.5 | 9.5 | 4 | 4.5 |
| Accuracy signals | 7 | 6.5 | 8.5 | 9 | 8.5 | 8 | 8 |
| **Average** | **6.1** | **6.0** | **8.6** | **8.9** | **8.5** | **5.8** | **6.2** |

1. **Send a receipt manually (under Customer emails): task clarity and structure.** Emailing a customer their receipt with **Email Receipt** is the only task on this page a cashier can do at the till. It sits as a small subheading below an admin table about order statuses. It has no screenshot. In "If something goes wrong" it is mentioned again with no link. A cashier who wants to email a receipt has to read the whole settings page to find it. **Smallest fix:** under the intro, add one tip call-out: "At the till: to email a customer their receipt, press **Email** on the paid screen. It works even when these switches are off. See Email the receipt." Then turn the "use **Email Receipt**" in "A customer gets no email" into a link to the same page.

2. **Emails sent automatically (table and the paragraph after it): language.** The main text uses WooCommerce status rules ("moves to On hold from Pending payment, Failed or Cancelled", "WooCommerce sends those only from the statuses listed"). The approved pages never ask the reader to think in order statuses. What the reader actually needs is a single result: some sales send the customer no automatic email. **Smallest fix:** replace the paragraph with "If your payment method marks sales as Processing or On hold, the customer gets no automatic email. Use Email Receipt instead." Then move the table into a collapsed section titled "Exactly when each email is sent", the same way "Why WCPOS sends New order…" is already handled.

3. **Emails sent automatically, Failed order row: accuracy signals.** This round's only change rewrote the row to "An order fails, from any status. The admin **Failed order** follows only Pending payment or On hold." That is a new claim. It gives no reason why the customer email and the admin email would behave differently, and it reads like a guess written to cover the gap the baseline had. If it's wrong, the page now states the wrong thing. If it's right, the reader can't tell why. **Smallest fix:** check the trigger in WooCommerce. If both emails fire on the same changes, use the admin row's wording ("A Pending payment or On hold order fails") and remove the comparison. If they really differ, keep "from any status" and add a short note on why.
