<!-- page-scores run: doc=support/troubleshooting/critical-error climb=support__troubleshooting__critical-error round=15 judge=opus-b -->
| Category | Critical Error (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 8.5 | 8 | 5.5 | 6.5 |
| Language | 6.5 | 6.5 | 8 | 8 | 8 | 6 | 6.5 |
| Visuals | 6 | 6 | 9 | 8.5 | 8.5 | 3 | 3 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8 | 6 | 7 |
| Layering | 8 | 8 | 8.5 | 8.5 | 9 | 6.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 3 | 3.5 |
| Accuracy signals | 8 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7 |
| **Average** | **7.29** | **7.07** | **8.57** | **8.50** | **8.43** | **5.29** | **5.57** |

**1. At the till: the Logs screenshot (Visuals)**
- **What's wrong:** The steps tell the cashier to press **Errors** and tap the **SYNC131** entry, but the screenshot shows the **All** filter and no error rows. Label 3 even says "Here there are none."
- **What's missing:** Steps 3 and 4 have no picture at all. Those are the steps that matter: opening the entry, the "Don't clear this device's data" line, and **Help — SYNC131**.
- **Phone width:** Labels 3, 4 and 5 overlap and the shot is too small to read.
- **Smallest fix:** Retake the shot with **Errors** pressed and one SYNC131 row showing, and label that row and its Status cell. Add a second shot of the open entry, labelling the data-safety line, **Help — SYNC131** and **Copy debug info**.

**2. Find the cause on your website: the POS-settings route to the log (Structure)**
- **What's wrong:** This edit moved the second way to the fatal-errors log from just under step 1 to after step 5 ("Once it's fixed…"). The numbered steps now read straight through, which is better. But someone who can't find WooCommerce → Status → Logs at step 1 only learns about the other route after reading the whole fix, so it's now harder to find.
- **Also:** The path uses ">" (WP Admin > POS > Settings) while the rest of the page uses "→".
- **Smallest fix:** Add one clause to step 1: "(or from **WP Admin → POS → Settings → Logs**, shown below)". Change ">" to "→" in that paragraph.

**3. Intro (Language / Task clarity)**
- **What's wrong:** The first sentence is a long one that starts with WordPress's own wording and "it broke while answering the till". That's not how a cashier would say it. What they need to know is buried halfway through: you'll see SYNC131, it isn't the till's fault, don't clear the till's data.
- **Repetition:** The "don't clear" warning appears in both the intro and the call-out right below it.
- **Smallest fix:** Start with "On the till you'll see a message with the code **SYNC131** (or a checkout code while you're taking a payment). Something went wrong on your website, not on the till." Move the WordPress quote into the "In a browser" bullet under Where you see it. Cut the intro's last sentence and leave the warning to the call-out.
