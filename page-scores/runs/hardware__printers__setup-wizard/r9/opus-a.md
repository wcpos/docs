<!-- page-scores run: doc=hardware/printers/setup-wizard climb=hardware__printers__setup-wizard round=9 judge=opus-a -->
| Category | Printer Setup Wizard (page) | Baseline | Open the Register | Checkout | Product Panel | Square: Build your customer's cart | Shopify: Processing a sale |
|---|---|---|---|---|---|---|---|
| Task clarity | 7.5 | 7 | 8.5 | 9 | 8.5 | 6 | 7.5 |
| Language | 6.5 | 7 | 7.5 | 8 | 7.5 | 6.5 | 7.5 |
| Visuals | 7 | 6.5 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7.5 | 8.5 | 9 | 8.5 | 7 | 8 |
| Layering | 8 | 8 | 9 | 9 | 9 | 7.5 | 6 |
| Consistency with approved pages | 7 | 7.5 | 9.5 | 9.5 | 9.5 | 4 | 4 |
| Accuracy signals | 7 | 7 | 8.5 | 9 | 8.5 | 7.5 | 7 |
| **Average** | **7.21** | **7.21** | **8.64** | **8.93** | **8.57** | **5.93** | **6.21** |

1. **"What the search finds" and "Print a test page" (Visuals, Task clarity).** The main path has no screenshot at all. Every side path does: No printer found, Enter the address yourself, More options and Edit printer. But the found-printer card with its badge, the **Did the test page print?** question and the column ruler are text only. The three answers are also never named as buttons, so the cashier can't tell whether "Yes, and it looks right", "Printed, but the ruler is off" and "Nothing came out" are the words on screen or just headings. The approved pages show a labelled shot of every step. **Smallest fix:** add one labelled shot of the test-page question panel. Label the printer card and its badge, **Paper width**, **Test page n · n characters per line**, and each answer button. Write the answer labels word for word as the three H3 headings below it.

2. **"Change a printer later", labels 6–7 (Language, Layering).** This round added the Edit printer screenshot. That shot is a gain, but it brought product internals into the main text: "Web print endpoint", "HTTPS or HTTP", "ESC/POS", "StarPRNT" and "Star Line Mode". A cashier would never say these words, and most will never change these settings. The **Connection and advanced settings** expander sits right below the shot and is unused for this. **Smallest fix:** keep markers 6 and 7 on the shot. Cut their labels to "Web print endpoint — see Connection and advanced settings" and "Printer Language — see Connection and advanced settings", and move the current wording into that expander.

3. **"Name, width and drawer", "Print a test page" and "Enter the address yourself" (Accuracy signals, Consistency).** One setting goes by three names:
   - **Printer text width** in More options, listed as characters
   - **Paper width** in the Edit printer shot, and in the test step, where you pick it in mm
   - **Which paper is in the printer?** in the ruler fix

   This reads as three different settings. Separately, the port is 8043 in the IP-entry shot and 8008 in the Edit printer shot, and the page never says why. **Smallest fix:** add "(shown as **Paper width** in Edit printer and during the test page)" to label 3 in Name, width and drawer. Change the Port label to "Port — filled in for you; it depends on the app. See Which port each app uses."
