<!-- page-scores run: doc=settings/wp-admin/email-notifications climb=settings__wp-admin__email-notifications round=16 judge=opus-b -->
1. Scores

| Category | Email Notifications | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 6.5 | 9 | 9 | 8.5 | 6 | 8 |
| Language | 6 | 5.5 | 8.5 | 8.5 | 8.5 | 6.5 | 7 |
| Visuals | 6.5 | 4 | 9.5 | 9.5 | 9 | 3 | 3.5 |
| Structure | 7.5 | 7 | 9 | 9 | 8.5 | 7 | 8 |
| Layering | 8.5 | 8 | 9 | 9 | 9 | 8 | 5 |
| Consistency with approved pages | 7 | 6.5 | 9.5 | 9.5 | 9.5 | 4 | 4.5 |
| Accuracy signals | 7.5 | 6.5 | 9 | 9 | 9 | 8 | 8.5 |
| **Average** | **7.14** | **6.29** | **9.07** | **9.07** | **8.86** | **6.07** | **6.36** |

2. Three highest-leverage findings

**1. Turn emails on or off: the screenshot and the flow diagram number the same three things in different orders (Visuals and accuracy signals)**
- **What's wrong:** In the settings screenshot, ② is Customer emails and ③ is Cashier emails. In the "Sale paid" diagram straight below it, ② is Cashier and ③ is Customer. Someone moving between the two legends will match the wrong recipient to the wrong switch. Apart from this clash, the diagram only repeats the screenshot's legend with "if… is ticked" added.
- **Smallest fix:** Reorder the diagram's bottom row and its legend to 1 Store · 2 Customer · 3 Cashier, so it uses the screenshot's numbers. Either way, the same number should never mean two different things on one page.

**2. Turn emails on or off: the screenshot has too few labels, can't be read on a phone, and shows a setting differently from a fresh install (Visuals)**
- **What's wrong:** Step 2 says to look under **Prevent overselling**, but that landmark has no label. Only the three switches are numbered, and the nine checkboxes have no labels at all. At phone width (`page/page-phone-02.png`) the checkbox names can't be read, so the reader can't match them to their own screen.
- **Also:** Legend ③ says "off when you install (shown switched on)". So the picture admits it doesn't match what a fresh install shows, which reads as a hedge.
- **Smallest fix:**
  - Capture the screen with Cashier emails off, as it is on install, and drop the "(shown switched on)" note.
  - Add a label on Prevent overselling.
  - Crop the image to the column width so the checkbox text can be read at phone size.

**3. Top of the page: nothing tells the cashier this is a manager setting, or where their own task is (Task clarity and language)**
- **What's wrong:** The page opens with `WP Admin → POS → Settings → Checkout` and then talks about Recipient(s), Pending payment, Order Status and WordPress filters. A cashier can't tell whether this is their job. The one thing they can do at the till, **Email Receipt**, sits in a small subsection lower down under Customer emails.
- **How the approved pages differ:** They open with a one-line scene and a call-out that states the prerequisite.
- **Smallest fix:** Add one call-out under the title, in the style of the approved pages: "A MANAGER SETS THIS IN WP ADMIN. At the till, to email a customer their receipt, see Send a receipt manually."
