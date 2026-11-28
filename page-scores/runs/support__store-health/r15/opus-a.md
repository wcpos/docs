<!-- page-scores run: doc=support/store-health climb=support__store-health round=15 judge=opus-a -->
| Category | Store Health | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 4.5 | 3.5 |
| Structure | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 6.5 | 7 |
| Layering | 8 | 7.5 | 8.5 | 8.5 | 9 | 7 | 5.5 |
| Consistency with approved pages | 8 | 8 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **7.43** | **7.36** | **8.50** | **8.79** | **8.57** | **5.86** | **6.00** |

**1. If something goes wrong › "Order not saved — the store refused it" at checkout (task clarity / accuracy signals)**
This section is one nine-sentence paragraph that covers two different situations: a problem the cashier can fix in the cart, and one they can't. The second situation's key instruction, "choose under changes that never reached your server", doesn't say what to choose. Its wording also differs from the panel title the cashier will actually see, "N changes never reached your server". A cashier has to read the paragraph twice to find their branch, and then can't match the words to the screen.
*Smallest fix:* Split it into two short paragraphs, "If you can fix it in the cart" and "If you can't". Rewrite the vague sentence as: "press **Store health** on the message, open **N changes never reached your server**, find the order and press **Send again** or **Discard**."

**2. Intro list "Here because something went wrong?" › new SQLite item (language / structure)**
This round of edits added "WCPOS sync integrity checks are off on SQLite in WordPress's Site Health" to the list of messages the cashier saw. A cashier never sees that message; it appears in the website's WordPress admin. It is also the longest and most technical line in the list, and the note that it's for someone else only comes at the very end. The cashier reads all of it before learning they can skip it. Making it reachable from the top of the page does help the person who runs the website (layering), so it should stay.
*Smallest fix:* Move the audience to the front of the line, e.g. "**For whoever runs your website:** "WCPOS sync integrity checks are off on SQLite" in Site Health". Leave the heading and the fold-out section below unchanged.

**3. Database › Registers screenshot (visuals)**
Label 3 ("A register") covers the whole register block: the sales count and receipt counters, the ✓ lines, the ⚠ closures warning and the arrow to expand it. The caption tells the cashier to "press the arrow on a warning for the detail", but nothing marks that arrow, and it is tiny on a phone. Three labels on a screen with at least six things worth teaching is a fault under the visuals rule.
*Smallest fix:* Add labels on the "4777 sales checked · counters 1–2" text, one ✓ line, the ⚠ warning line and its expand arrow. Split caption 3 into those four entries: what was checked, a check that passed, a warning, and how to open the warning.
