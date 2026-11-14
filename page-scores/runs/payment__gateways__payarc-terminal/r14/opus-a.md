<!-- page-scores run: doc=payment/gateways/payarc-terminal climb=payment__gateways__payarc-terminal round=14 judge=opus-a -->
| Category | PayArc Terminal (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 7.5 | 7.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Visuals | 6 | 4.5 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 8 | 7 | 8.5 | 9 | 8.5 | 6.5 | 7 |
| Layering | 8 | 7 | 8.5 | 8.5 | 9 | 7 | 5.5 |
| Consistency with approved pages | 7 | 6.5 | 9.5 | 9.5 | 9.5 | 4.5 | 4.5 |
| Accuracy signals | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 7.5 | 7.5 |
| Admin setup | 8.5 | 5.5 | 7 | 6.5 | 6 | 7 | 5.5 |
| **Average** | **7.5** | **6.5** | **8.6** | **8.6** | **8.4** | **6.1** | **6.0** |

1. **Take a card payment (and Cancel a payment): Visuals / Consistency.** All three approved pages put a numbered screenshot of the till under each task heading. This page has none at the till, so the cashier gets five steps of text only. They have to find **PayArc Terminal** tile, **Terminal: …**, **Change**, **Send … to PayArc Terminal**, the four-step **On the terminal** tracker, **Details** and **Cancel on terminal** with nothing to look at. The only screenshots on the page are of WP Admin. **Smallest fix:** add two annotated shots in the Checkout page's style:
   - The tender pane with the PayArc tile selected, labelling the tile, Terminal: …, Change, the amount and the Send button.
   - The On the terminal state, labelling the four steps, Details and Cancel on terminal.

2. **Enter your PayArc credentials: Admin setup / Accuracy signals.** Only the MID gets a precise source (**Merchant Profile**). The ClientSecret is "from the **API** section" and the SecretKey is "the API token from the PayArc dashboard", with no menu name for either. Test credentials come from "PayArc's test dashboard", with no address or path. An admin with the PayArc dashboard open still has to hunt for two of the three keys, and has to guess which Test login to use. **Smallest fix:** in steps 3–5, give the exact PayArc dashboard menu path for each credential. In step 1, name the test dashboard by its URL or menu.

3. **Switch it on in WCPOS / Add your terminal: Accuracy signals.**
   - **The label points at nothing.** Label 2 says "**Enabled** — the switch beside the number", but the screenshot has no number next to the toggle, only the gateway ID `payarc_terminal_for_woocommerce`.
   - **The screenshot contradicts the text.** The settings shot under Add your terminal shows help text saying the Terminal Registry is "optional reporting metadata and does not connect or activate the terminal". The Settings reference says the registry decides which terminals the till offers, and that a disabled one "is left out".

   **Smallest fix:** change label 2 to "the switch at the end of the row". Add one sentence after the Add your terminal callouts saying which is true: is the registry only for reporting, or does it filter which terminals the till offers?
