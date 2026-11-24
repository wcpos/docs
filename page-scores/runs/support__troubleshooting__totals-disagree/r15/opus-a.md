<!-- page-scores run: doc=support/troubleshooting/totals-disagree climb=support__troubleshooting__totals-disagree round=15 judge=opus-a -->
| Category | Totals Don't Match (page) | Baseline | Open the Register (J1) | Checkout (J2) | Product Panel (J12) | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 9 | 9 | 8.5 | 6.5 | 8 |
| Language | 6 | 6 | 8.5 | 8.5 | 8.5 | 6 | 7.5 |
| Visuals | 6 | 6 | 8.5 | 8.5 | 9 | 4 | 5 |
| Structure | 7 | 7 | 9 | 9 | 8.5 | 6 | 8 |
| Layering | 7 | 7 | 8.5 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 7 | 7 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7 | 7 | 8.5 | 9 | 8.5 | 7.5 | 8 |
| **Average** | **6.6** | **6.6** | **8.7** | **8.9** | **8.7** | **6.1** | **6.8** |

The page and the baseline are the same, word for word and in every desktop and phone render I compared. That is why the two columns match.

1. **"What the notice means": the notice list (Visuals).** The whole page is about one notice, and the cashier never sees it. Its four parts (the line under the title, the changed amounts shown as till → store, "N line amounts also differ", and "Why totals disagree") are only a bullet list. Every approved page shows the thing the cashier is looking at and numbers each part. **Smallest fix:** swap the bullet list for one screenshot of a cart showing the notice, with four numbered labels for those four parts, in the same style as the Checkout page's "Build the cart" shot.

2. **"What the notice means": first two paragraphs and the offline warning (Task clarity / Structure).** At the till, the cashier only needs to know one thing: which figure to charge. The page says "the order keeps your store's figures" but never says "charge the figure on the right of the arrow." It also puts the offline-sales warning between that paragraph and the description of the notice, so the cashier has to read the warning before they learn how to read the notice. **Smallest fix:** add one line before the warning: "Charge the store's figure, on the right of the →." Then move the "Don't take offline sales" warning below the notice description, before "The notice can't be closed."

3. **"What causes it" and "What to send us" (Layering / Language).** A cashier can't act on these sections. They cover WP Admin paths, Priority and Compound settings, the tax rate table and log event codes, all for whoever manages the store. Yet they get the same heading weight as the cashier's own steps. The handover line ("The causes below are for them") is plain text placed just under a collapsed panel, where it's easy to miss. **Smallest fix:** turn "If the notice still appears on the test sale, show whoever manages your store…" into a tip call-out. Then put "What causes it" and "What to send us" under one heading, "For whoever manages your store." Nothing gets deleted; it's just clearly marked as not the cashier's job.
