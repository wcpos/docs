<!-- page-scores run: doc=support/troubleshooting/critical-error climb=support__troubleshooting__critical-error round=15 judge=opus-a -->
## 1. Scores

| Category | Critical Error | Baseline | Open the Register | Checkout | Product Panel | Square (competitor) | Shopify (competitor) |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 8.5 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 5.5 | 5.5 | 7.5 | 8 | 8 | 7 | 7.5 |
| Visuals | 7 | 7 | 9 | 9 | 9 | 3 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 9 | 8.5 | 7 | 8 |
| Layering | 7.5 | 7.5 | 9 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 8 | 8 | 9.5 | 9.5 | 9 | 4 | 4.5 |
| Accuracy signals | 7.5 | 7 | 8.5 | 9 | 8.5 | 8 | 8 |
| **Average** | **7.14** | **7.00** | **8.64** | **8.93** | **8.64** | **6.14** | **6.43** |

## 2. Highest-leverage findings

**1. "At the till", Store health → Logs screenshot · Visuals / Accuracy signals**
Steps 2–4 tell the cashier to press **Errors** and tap the **SYNC131** entry. The screenshot shows the opposite situation:
- **All** is selected, not **Errors**.
- The counter reads 0 errors today, and label 3 says "Here there are none."
- Every row is a routine sync or info entry.

So the one thing the cashier is hunting for, the SYNC131 row and its **Status** column, never appears on screen. On a phone the shot is also too small to read without zooming.
*Smallest fix:* retake the shot with **Errors** selected and one SYNC131 entry showing. Point label 3 at the non-zero error count and label 4 at that entry's **Status** cell, and change label 3's text to match.

**2. "Find the cause on your website", the second route to the log · Structure / Layering**
This round moved the route through POS settings (**WP Admin > POS > Settings > Logs**) out of step 1. It now sits after step 5, which already says "Once it's fixed, go back to the till." The numbered steps flow better, but this is another way to do step 1, and you only find it after reading through to "you're done." Someone who can't find **WooCommerce → Status → Logs** has nothing at step 1 pointing them to it.
*Smallest fix:* add one clause to the end of step 1: "You can also get there from **WP Admin > POS > Settings > Logs** (shown below)." Leave the paragraph and screenshot where they are.

**3. Intro and "Where you see it" · Structure / Language**
The section that helps the cashier recognise the error ("Where you see it") comes after the steps that fix it. The checkout-code guidance is repeated three times: in the intro, in "At the till" and in "Where you see it." The intro also opens with technical terms a cashier wouldn't say out loud: "WordPress's own message", "broke while answering the till." The bullet "In the store's own reason, where the POS shows one" reads as a hedge.
*Smallest fix:* shorten the intro to two sentences:
- what the cashier sees (a message with **SYNC131**, or a checkout code during a payment)
- "it's a website problem; don't clear the till"

Then cut the **At checkout** bullet from "Where you see it", since "At the till" already covers it, and change "where the POS shows one" to name the two places it appears: at checkout, or on a change your store refused.
