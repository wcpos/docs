<!-- page-scores run: doc=support/troubleshooting/cloudflare climb=support__troubleshooting__cloudflare round=20 judge=opus-a -->
| Category | Cloudflare (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 6 | 6 | 8 | 8.5 | 8 | 6.5 | 7.5 |
| Visuals | 5.5 | 4.5 | 9 | 9 | 9 | 3 | 3 |
| Structure | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 7 | 7.5 |
| Layering | 8 | 8 | 9 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 7 | 6.5 | 10 | 10 | 10 | 5 | 5 |
| Accuracy signals | 8 | 6.5 | 9 | 9 | 8.5 | 8 | 8 |
| **Average** | **7.1** | **6.6** | **8.9** | **9.1** | **8.8** | **6.2** | **6.4** |

1. **At the till / Signs that Cloudflare is blocking the app: Visuals.** The cashier sees two screens: the **Security check for your-store.com** window and the HOST121 connect screen. Neither one is shown. The page's only screenshot is a WP Admin screen, and only the store owner sees that. Every approved page puts a numbered shot of what the cashier sees above the text that explains it. Here the cashier has to match the screen in front of them against words alone. **Smallest fix:** under "Signs…", add one numbered shot of each screen. Label the window title, the checkbox and the time limit on the first. Label the error message, the HOST121 code and the button that retries on the second. Then point each bullet under "At the till" to its shot.

2. **Add a Skip rule for the REST API, step 3: Task clarity.** The expression to paste is cut off on one long line. On desktop it ends at `(http.request.uri.path`. On a phone it ends at `(starts_with(http.request.uri.pa`. No copy button is visible in either render. The store owner can't read or check the whole rule, and a partial paste breaks it without any warning. **Smallest fix:** split the expression at each `or` so it wraps inside the column, and make sure a copy button shows on the block.

3. **Find the Cloudflare feature that is blocking it, WP Admin screenshot: Visuals and Consistency.** The shot is a wide, thin strip. At phone width the notice text can't be read and labels 1 to 3 sit almost on top of each other. Label 2 also uses "WAF challenges", but the section below calls the same thing "Custom rules or managed rules". A reader can't link the two. **Smallest fix:** crop the shot to the notice and the **General** menu item so it shows larger on a phone. Then add "(custom rules and managed rules)" after "WAF challenges" in the text for label 2.
