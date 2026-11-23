<!-- page-scores run: doc=products/pos-only-products climb=products__pos-only-products round=14 judge=opus-b -->
Comparison done. Here are the scores and findings.

| Category | POS-Only Products | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 6.5 | 7.5 | 8 | 8 | 6 | 7 |
| Visuals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 3 | 3 |
| Structure | 7.5 | 7 | 8.5 | 8.5 | 8.5 | 6.5 | 7 |
| Layering | 8 | 8 | 8.5 | 9 | 8.5 | 6.5 | 5 |
| Consistency with approved pages | 8 | 7.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **7.4** | **7.1** | **8.4** | **8.6** | **8.5** | **5.7** | **6.0** |

**1. "In the POS": Structure / Task clarity.** This is the only part a cashier at the till needs, but it comes sixth on the page, after Switch it on, the two ways to set visibility, Variations and Find them again, which are all WP Admin tasks. The "Set in WP Admin" call-out now links to it, which is better than the baseline. Still, a cashier who scrolls instead of tapping has to get past four screenfuls of admin screenshots on a phone first (`page/page-phone-04.png`, `page/page-phone-05.png`). **Smallest fix:** move the "In the POS" section, with its screenshot, so it sits directly under the "Set in WP Admin" call-out. Then change the call-out's "See In the POS" to "below".

**2. Variations screenshot: Visuals / Accuracy signals.** The new shot is labelled, which is better than the baseline's unlabelled shot with a caption. But label 1 says "This one is Natural's" while the variation's header row (Natural) has been cropped off the top. The reader can't check the claim, and the only variation name they can see is Charcoal. Most of the shot's height goes on Shipping class, Tax class, three tax checkboxes and Description, none of which the steps use. At phone width the two labelled controls come out tiny. **Smallest fix:** re-crop the shot so it starts at the "#24 Natural" header row and ends at Save changes, leaving out the fields from Shipping class to Description. The existing two labels can stay.

**3. "Many products at once" screenshot: Visuals / Task clarity.** Step 4 says "Press Update", but the shot stops above that button, and label 2 has to explain that "Update is at the foot of the panel, below this view." That leaves one of the four steps without a visual target, and the control the reader looks for doesn't appear in the picture. The cramped "POS / visibility" field label is also unreadable on a phone. **Smallest fix:** extend the crop down to take in the bulk-edit panel's Update button, add label 3 "Update — saves every ticked product", and cut the "below this view" sentence from label 2.
