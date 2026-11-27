<!-- page-scores run: doc=orders/refunds climb=orders__refunds round=12 judge=opus-b -->
| Category | Refund Rules | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 6.5 | 8.5 | 9 | 8.5 | 6 | 8 |
| Language | 6 | 5.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 6.5 | 6.5 | 8.5 | 9 | 8.5 | 3 | 3 |
| Structure | 7 | 7 | 8.5 | 9 | 8.5 | 6.5 | 7.5 |
| Layering | 8.5 | 8 | 8.5 | 9 | 9 | 7 | 5.5 |
| Consistency with approved pages | 7 | 7 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.0** | **6.7** | **8.5** | **8.9** | **8.6** | **5.7** | **6.1** |

1. **When to Use Cash vs. Original Method: visuals and accuracy.** This section tells the cashier to "choose **Refund to (payment method)**" or "choose **Refund via cash**". No screenshot on the page shows where that choice is made. The only labelled refund form is for an order paid in cash, so it has no choice on it. Its label 8 calls the button "**Refund (amount) in cash**", which is a third name for the same thing. A cashier with a card customer has nothing to match against the screen. **Smallest fix:** add one shot of the refund form for a card-paid order, with a label on the place where you choose where the money goes. Then use the exact on-screen wording in both the bullets and label 8.

2. **Exchanges: structure and visuals.** This section now holds a real till task: ring up the new item, use **Return item** on the quantity keypad, and take payment for the difference. It is written as one paragraph with no steps and no picture of the **Return item** key. It also sits near the bottom of the page, below the reference sections, and the intro only points to Refunds at the Till. The fallback for when the returned item costs more does get numbered steps, but the main path doesn't. **Smallest fix:** turn the first paragraph into 3–4 numbered steps like the fallback. Add a small labelled crop of the quantity keypad with **Return item** marked. Add "for an exchange, see Exchanges" to the intro sentence that already links to Refunds at the Till.

3. **If a Refund Fails, "Check before you try again" call-out: language.** This is the warning that stops a double refund, and it ends with "If the order hasn't updated, check it in WP Admin. See PAYMENT311." A cashier at the till can't open WP Admin and won't know what an error code means. That leaves the riskiest moment on the page without a step they can take. The same problem shows up in "WordPress user ID" (Refunds Section, label 3) and "POS open / POS partial". **Smallest fix:** replace the last sentence with "If the refund still isn't there, don't try again: ask a manager to check the order in your store." Move the PAYMENT311 link into a "For managers" expandable section below the call-out.
