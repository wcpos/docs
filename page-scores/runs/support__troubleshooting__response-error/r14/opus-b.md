<!-- page-scores run: doc=support/troubleshooting/response-error climb=support__troubleshooting__response-error round=14 judge=opus-b -->
| Category | Response Error (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6 | 7.5 | 8.5 | 8 | 5.5 | 7 |
| Visuals | 7 | 7 | 9 | 9 | 9 | 4.5 | 4 |
| Structure | 7.5 | 7 | 8.5 | 9 | 8.5 | 7 | 7 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7.5 | 7 | 8.5 | 9 | 8.5 | 7.5 | 8 |
| **Average** | **7.4** | **7.1** | **8.6** | **8.9** | **8.6** | **6.1** | **6.4** |

1. **Find the error: Visuals / Accuracy signals.** The only screenshot of the cashier's side opens an **AUTH201** row, a 403 "Your store rejected a change". That isn't a response error. Label 4 has to explain that "this example is a refused change", so the cashier has to translate the picture into the codes this page is about. **Fix:** retake the shot with a **SYNC131** row open, showing a 500 under Request. Then cut the "This example is a refused change (403)" sentence from label 4.

2. **At the till, step 2: Task clarity.** This round changed "ask your manager or the store owner before you take any money" to "ask before you take any money". At the riskiest moment the cashier no longer knows who to ask, and step 1 still names the person, so the two steps now disagree. **Fix:** put "your manager or the store owner" back after "ask" in step 2.

3. **At the till, after step 3: Structure.** "Don't clear this device's data to make the error go away…" is a warning: ignoring it can lose sales the store doesn't have yet. But it sits as a plain paragraph between the steps and the next heading, and it looks like any other body text. The approved pages put this kind of warning in a call-out. **Fix:** wrap the paragraph in a warning call-out titled "DON'T CLEAR THIS DEVICE". Keep the wording and the link to Clear Local Data.
