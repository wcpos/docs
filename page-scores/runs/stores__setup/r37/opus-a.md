<!-- page-scores run: doc=stores/setup climb=stores__setup round=37 judge=opus-a -->
| Category | Set Up Stores (page) | Baseline | Open the Register (j1) | Checkout (j2) | Product Panel (j12) | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6.5 | 7 |
| Language | 6.5 | 6.5 | 8 | 8 | 7.5 | 6 | 6.5 |
| Visuals | 7.5 | 7.5 | 9 | 8.5 | 9 | 3 | 3.5 |
| Structure | 7.5 | 7.5 | 8.5 | 8.5 | 8 | 6.5 | 7 |
| Layering | 8.5 | 8.5 | 8.5 | 8.5 | 9 | 7.5 | 5 |
| Consistency with approved pages | 8 | 8 | 9 | 9 | 9 | 4 | 4 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7 |
| **Average** | **7.6** | **7.6** | **8.6** | **8.5** | **8.4** | **5.8** | **5.7** |

The page and the Baseline have the same text, and every render I compared looks the same at desktop and phone width. That's why the two columns score the same. I compared all of desktop 01–06 and phone 02 and 04. I did not open desktop 07 or the other phone renders for the Baseline.

**1. Cash drawer rules: Visuals**
- **What's wrong:** This is the one step most readers come to the page for: turn on **Open and close the register each day**. In the screenshot, marker 2 sits on top of the switch you're told to click. On desktop it is also cut off at the frame edge, and on a phone it hides the switch completely. Markers 1 and 3 are labelled **Site defaults** and **Site default**, which are almost the same words for two different things. A reader has to read both captions twice to tell them apart.
- **Smallest fix:** Move marker 2 to the right of the switch's label text. Rename caption 3 to say what the reader sees, for example "Follows site: this rule…", so it no longer echoes caption 1.

**2. What cashiers see: Structure / Task clarity**
- **What's wrong:** The **Choose a store** screenshot comes after both "If sign-in offers…" branches and after the "Either way" check. Someone following step 1 ("Under **Choose a store**, pick the new store") has to scroll past the second branch to see what they're looking at. The approved pages put the screenshot right under the step it shows. Also, the line about the heading saying **Store** when there's only one store appears twice: once in step 1 and again in caption 3.
- **Smallest fix:** Move the sentence "On a new device, **Choose a store** lists…" and its screenshot up to sit right after step 2 of the first branch (**Open POS**). Then delete the "only one store" clause from step 1, since caption 3 already says it.

**3. What cashiers see → "Register statuses" expandable: Accuracy signals / Consistency**
- **What's wrong:** The expandable's title lists the statuses as Closed, Counting, Approval needed and Overdue. The approved Open the Register page lists the same bar as reading Counting, Approval needed, **Offline** or Overdue. A cashier who sees **Offline** beside the register name gets nothing from this page, and the mismatch reads as a contradiction.
- **Smallest fix:** Add **Offline** to the expandable's title and to its contents, in the same order as Open the Register: "Closed, Counting, Approval needed, Offline, Overdue".
