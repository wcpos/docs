<!-- page-scores run: doc=settings/wp-admin/email-notifications climb=settings__wp-admin__email-notifications round=16 judge=opus-a -->
## 1. Scores

| Category | Email Notifications (page) | Baseline | Open the Register | Checkout (sell to a guest) | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 6.5 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 5 | 4.5 | 7.5 | 8 | 8 | 6.5 | 7.5 |
| Visuals | 6 | 5 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 6 | 7.5 |
| Layering | 8 | 8 | 8.5 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 7 | 6.5 | 9.5 | 9.5 | 9.5 | 5 | 5.5 |
| Accuracy signals | 7 | 7 | 9 | 9 | 8.5 | 8 | 8 |
| **Average** | **6.79** | **6.36** | **8.64** | **8.86** | **8.64** | **6.00** | **6.50** |

## 2. Highest-leverage findings

**1. Turn emails on or off, settings screenshot (Visuals)**
- **What's wrong:**
  - The shot labels only the three switches.
  - It doesn't label "Prevent overselling", which step 2 tells the reader to look for.
  - It doesn't label any of the nine email checkboxes, which are what step 3 asks them to untick.
  - The crop is mostly white space. On a phone the checkbox text can't be read.
  - Label 3 says "(shown switched on)", so the reader is told the picture doesn't match a fresh install.
- **Smallest fix:**
  - Crop tight to the left column so the shot fills the width on a phone.
  - Add a badge on "Prevent overselling" ("Find the email switches under this") and one on a single checkbox ("Untick to stop just this email").
  - Replace "(shown switched on)" with "turn it on to see its checkbox".

**2. If something goes wrong → "A customer gets no email" (Accuracy signals)**
- **What's wrong:** "WooCommerce sends the customer nothing for that sale" contradicts the Customer emails table on the same page. A Processing or On hold sale still sends Completed order when it's later marked Completed, and Refunded order if it's refunded. A reader who trusts this line will conclude the customer never gets an email.
- **Smallest fix:** Change it to "WooCommerce sends the customer no email when the sale is paid. They get one later only if the order is marked Completed or refunded."

**3. Customer emails → Emails sent automatically table (Language)**
- **What's wrong:** In the Order on hold and Processing order rows, the "Sent when" cells start with WooCommerce status changes ("from Pending payment, Failed or Cancelled") that nobody at the till ever sees. The one fact that matters for a sale paid at the till comes last: "Not sent when a POS sale goes straight to…". On a phone it sits about six lines down in a narrow column.
- **Smallest fix:** In those two rows, put the till case first: "Not sent for a sale paid at the till. Sent when an order moves to On hold from Pending payment, Failed or Cancelled." Do the same for Processing.
