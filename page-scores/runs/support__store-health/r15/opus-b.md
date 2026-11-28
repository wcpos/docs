<!-- page-scores run: doc=support/store-health climb=support__store-health round=15 judge=opus-b -->
| Category | Store Health (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 8.5 | 9 | 8 | 6.5 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 6.5 |
| Visuals | 7.5 | 7.5 | 8.5 | 9 | 8 | 3 | 3.5 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Layering | 8 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 8 | 9 | 9 | 9 | 4 | 4.5 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| **Average** | **7.4** | **7.3** | **8.5** | **8.7** | **8.4** | **5.9** | **6.1** |

1. **If something goes wrong → "Order not saved — the store refused it" at checkout.** Categories: task clarity and structure. Two different fixes are packed into one 9-sentence paragraph: fix the problem in the cart, or go to Store health and choose Send again or Discard. A cashier with an angry customer at the till has to read it twice to see where one path stops and the other starts. One sentence is also broken: "choose under changes that never reached your server" never says what to choose. Its link text also doesn't match the panel title, which is "N changes never reached your server". **Smallest fix:** split the paragraph into a numbered list, the same shape as "changes waiting to send" won't go down: (1) fix what the reason names and press Checkout; (2) if you can't fix it in the cart, press Store health on the message, find the order under N changes never reached your server, and press Send again once the store is fixed; (3) Discard, and what it deletes.

2. **Database → Registers.** Category: visuals. The screenshot is the busiest on the page but has only three labels. Label 3 alone has to cover five things, and the warning row ("7 closures whose totals disagree"), its expand arrow, the tick rows and the "3 sales name a register session…" line have no labels at all. The text tells the cashier to "press the arrow on a warning", but the arrow isn't marked. **Smallest fix:** add labels for the warning row, its arrow, one tick row and the last line, and split the long text under label 3 across them.

3. **If something goes wrong → "WCPOS sync integrity checks are off on SQLite" in Site Health.** Categories: structure, plus consistency in its details. This round's edit made the entry findable: it's now in the jump list and the table of contents, where the baseline hid it in a toggle. But the heading leads straight into a closed toggle with no text. A cashier who taps through from the jump list lands on a heading with nothing to read, and isn't told that there's nothing to do at the till. The toggle also has a grey arrow, while every other toggle on the page has a red one. **Smallest fix:** add one sentence under the heading, such as "Nothing to do at the till: pass this to whoever runs your website", and give the toggle the same style as the others.
