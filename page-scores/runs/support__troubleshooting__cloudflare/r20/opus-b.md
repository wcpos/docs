<!-- page-scores run: doc=support/troubleshooting/cloudflare climb=support__troubleshooting__cloudflare round=20 judge=opus-b -->
| Category | Cloudflare (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Quick reference – processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 6.5 | 6.5 | 8.5 | 9 | 8 | 6.5 | 7 |
| Language | 5 | 5 | 8 | 8.5 | 8 | 6.5 | 7 |
| Visuals | 4.5 | 3.5 | 9 | 9 | 8.5 | 3 | 3 |
| Structure | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Layering | 8 | 8 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 6.5 | 6 | 9 | 9 | 8.5 | 4.5 | 4.5 |
| Accuracy signals | 7.5 | 6 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **6.4** | **5.9** | **8.6** | **8.8** | **8.4** | **6.0** | **6.0** |

**1. At the till / Signs that Cloudflare is blocking the app (visuals, task clarity)**
This is the only part written for the cashier, and it has no screenshot. The cashier is told to "tick the box within two minutes" in a "Security check window" they've never been shown. The only screen that names HOST121 is described in a bullet in the next section. So the cashier acts before they can tell which case they're in, and has to scroll down and back up to check. The one shot this round added is for the store owner.
**Smallest fix:** Move the two "Signs" bullets above "At the till". Under the first "At the till" bullet, add one numbered shot of the Security check window, in the same style as the approved pages. Label the window title, the checkbox and where the two-minute limit shows.

**2. Find the Cloudflare feature that is blocking it: the new WP Admin shot (visuals)**
The shot is a thin strip of the settings page. At phone width (`page/page-phone-02.png`) the notice text can't be read, and that notice is the whole point of the shot. Label 3, "How to add the rule — opens this page", sends the reader back to the page they're already on, so it teaches nothing.
**Smallest fix:** Crop to the notice and the General menu item only, so the text can be read on a phone. Either drop label 3 or change it to say where the link leads ("opens this page at Add a Skip rule").

**3. Add a Skip rule for the REST API, step 5 (visuals, accuracy signals)**
Step 5 is where mistakes are most likely. The owner has to tick two boxes always, tick two more only in certain cases, and leave the "(Previous version)" entries alone. All of this is written as nested bullets, with no picture of the Cloudflare panel. A wrong tick fails silently, and the cashier is the one who finds out at the till. No other step in this section needs a picture as much.
**Smallest fix:** Add one shot of the Skip options panel with numbered labels on the four named checkboxes and on one "(Previous version)" entry. The existing sub-bullets become the label list below it, in the same shape as the approved pages.
