<!-- page-scores run: doc=extensions/index climb=extensions__index round=30 judge=opus-a -->
| Category | Add-ons (page) | Baseline | Open the Register | Checkout | Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 7 | 6.5 | 8.5 | 8.5 | 8.5 | 6 | 7.5 |
| Language | 5.5 | 5.5 | 8 | 8.5 | 8 | 6 | 7 |
| Visuals | 7 | 7 | 9 | 9 | 9 | 4.5 | 4 |
| Structure | 7 | 7 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| Layering | 7.5 | 7.5 | 8.5 | 8.5 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 7.5 | 7.5 | 9 | 9 | 9 | 5 | 5 |
| Accuracy signals | 6.5 | 6 | 8.5 | 8.5 | 8.5 | 7 | 7.5 |
| **Average** | **6.9** | **6.7** | **8.6** | **8.6** | **8.6** | **6.1** | **6.3** |

### Highest-leverage findings

**1. Install an extension: visuals.** Steps 3 and 4 tell the reader to press **Install** and open **⋮ (More actions)** on a card. The directory screenshot under the steps has callouts only for Extensions, Search, Refresh and the tabs (1–4). The two controls the steps actually use have no callout. The cards in the shot also use other names ("Authorize.net Tap to Pay for WooCommerce (beta)", "Email Invoice Gateway") than the list above ("Authorize.net Tap to Pay", "Email Invoice"), so a reader can't match what they read to what they see.
**Smallest fix:** On one card in the existing shot, add callout 5 on **Install** and callout 6 on **⋮**, each with a one-line legend entry. Add one sentence to step 2: "In WordPress the cards carry the full plugin name, such as *… for WooCommerce*."

**2. Auto-updates and If something goes wrong: accuracy and language.** "Update by hand" means two things on this page. In *Update, turn off or turn on*, *Updates* and *Without Pro* it means uploading the zip from GitHub. In *Auto-updates* and the "Automatic updates are disabled on this site." entry, "Update by hand with **Update**" means pressing the button. On the free version there is no **Update** button, so the second meaning sends the reader to a control they don't have. The same site-wide condition also appears under two strings: "Auto-updates are turned off on this site" in *Auto-updates* and "Automatic updates are disabled on this site." in *If something goes wrong*. Nothing says where each one appears.
**Smallest fix:** In both places, replace "Update by hand with **Update**" with "Press **Update** on the card instead (without Pro, see Without Pro)". Start the troubleshooting entry with "If you try to switch Auto-update on anyway, the notice reads…" so it's clear that string is a separate message.

**3. A payment extension's card (WCPOS Pro), callout 1 (Status): layering and structure.** This legend entry has grown into a paragraph. It covers five states, a two-step count, a rule about which extensions report their settings, and a walkthrough of this particular card. Callout 4 (Settings button) explains the same reporting caveat again. A reader looking for what "1 step left" means has to get through the whole entry, which breaks the one-line legend shape the approved pages use. Step 3 of the install sends readers straight to this section.
**Smallest fix:** Cut callout 1 down to: "**Status**: **2 steps left**, **1 step left**, **Ready** (or **Check settings**, see 4), or **Update available**. The steps are switching it on in the POS and finishing its settings." Leave the "this one doesn't report its settings" explanation in callout 4 only.
