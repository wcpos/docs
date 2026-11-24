<!-- page-scores run: doc=support/troubleshooting/response-error climb=support__troubleshooting__response-error round=14 judge=opus-a -->
| Category | Response Error (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8 | 6 | 7 |
| Language | 7 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 6.5 | 6.5 | 9 | 9 | 8.5 | 4 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 9 | 8 | 6.5 | 6.5 |
| Layering | 8 | 8 | 9 | 8.5 | 9 | 7 | 5 |
| Consistency with approved pages | 8 | 8 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7 | 7 | 8.5 | 9 | 8.5 | 7 | 7 |
| **Average** | **7.4** | **7.1** | **8.6** | **8.9** | **8.4** | **5.8** | **5.7** |

### Findings for the page under review

**1. Find the error: the screenshot shows the wrong error (Visuals, Accuracy signals)**
The only screenshot a cashier uses on this page shows a different error. The opened row is `AUTH201`, "Your store rejected a change", with a `403` status. Callout 4 has to admit "This example is a refused change (403)" and then say what a response error would look like instead. So a cashier comparing their screen with the picture sees a code this page doesn't cover.
*Smallest fix:* Retake the same Logs shot with a `CHECKOUT201` (or `SYNC131`) row open showing `500`. Then delete the "This example is a refused change (403)" sentence from callout 4. The seven labels can stay where they are.

**2. Find the error: the Errors filter can hide the cashier's code (Task clarity, Structure)**
Two instructions pull against each other. The intro says "Tap Errors to see only the problems", and callout 3 says Errors "shows only the rows that need attention". But `SYNC151`, and some `SYNC131` rows, only appear under All. A cashier who does what the first sentence says may find nothing and give up. The exception is buried in a sentence about retries that a cashier can't act on.
*Smallest fix:* Replace "SYNC151, and a SYNC131 on a change the POS is still retrying, are warnings: find them under All" with "If you don't see your code under Errors, tap All." Add the same sentence to callout 3.

**3. At the till, step 2: the edit dropped who to ask (Task clarity, Language)**
This round shortened step 2 from "ask your manager or the store owner before you take any money" to "ask before you take any money". It's the point where the customer might be charged twice, and the cashier is no longer told who to ask. Step 1 still names "your manager or the store owner" for the same situation, so the two steps now read differently.
*Smallest fix:* Change step 2 back to "If you can't tell, ask your manager or the store owner before you take any money."
