<!-- page-scores run: doc=settings/store/general climb=settings__store__general round=12 judge=opus-a -->
| Category | Store Defaults (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 7 | 7 | 8 | 8.5 | 8.5 | 6.5 | 7 |
| Visuals | 7.5 | 7 | 9 | 9 | 9 | 3 | 3 |
| Structure | 7.5 | 7 | 9 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8.5 | 8.5 | 9 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9.5 | 9.5 | 9 | 4 | 4.5 |
| Accuracy signals | 8 | 7.5 | 9 | 9 | 9 | 7.5 | 8 |
| **Average** | **7.7** | **7.4** | **8.9** | **9.0** | **8.8** | **6.0** | **6.1** |

**1. Page title and opening line: consistency and structure.** The page is called "Store Defaults", but the POS screen, the body text and the first screenshot all call it **General**. The docs menu also lists a separate **General** page as the next page, and the opening line `POS settings: Settings → General` is in code font and doesn't say they are the same thing. A cashier looking for the General screen in the docs menu would tap the wrong page. **Smallest fix:** change the opening line to plain words, such as "In the POS this page is called **General**: open **Settings**, it's first in the list." Then retitle the sibling menu entry "WP Admin General settings" so it matches its Related Documentation card.

**2. Restore server settings, the two screenshots: visuals.** The confirmation dialog takes up a small part of a full-screen shot. On a phone it can't be read, and markers 1 and 2 sit on top of the **Cancel** and **Restore Server Settings** buttons they are meant to point to. In the offline shot, label 1 ("the restore that couldn't reach the store") points at the button the cashier just pressed and teaches nothing. Meanwhile the **Couldn't reach the store** message, the thing they need to recognise, has no label. **Smallest fix:** crop the first shot to the dialog and move the markers beside the buttons. In the second shot, move marker 1 to the **Couldn't reach the store** line and relabel it "Couldn't reach the store — nothing was changed."

**3. Money format screenshot: visuals.** Seven rows of **Currency & numbers** are visible, but only **Currency** and **Number of Decimals** are numbered. **Currency Position**, **Decimal Separator**, **Thousand Separator** and **Thousands Group Style** have no markers, and they are explained only in prose and in a collapsed section further down. A cashier fixing "Prices show the wrong symbol or separators" (If something goes wrong) has to match prose names to unlabelled rows. **Smallest fix:** add markers 5–8 to those four rows, each with a short label such as "how money looks on this screen only — see below". Keep the collapsed section for the details.
