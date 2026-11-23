<!-- page-scores run: doc=payment/gateways/stripe-terminal climb=payment__gateways__stripe-terminal round=27 judge=opus-b -->
| Category | Stripe Terminal (page) | Baseline | j1 Open the Register | j2 Checkout | j12 Product Panel | Square | Shopify |
|---|---|---|---|---|---|---|---|
| Task clarity | 8 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7.5 |
| Language | 7 | 7 | 8.5 | 8.5 | 8 | 7 | 7.5 |
| Visuals | 7 | 6 | 9 | 9 | 8.5 | 3 | 3.5 |
| Structure | 7.5 | 7.5 | 9 | 9 | 8.5 | 6.5 | 7 |
| Layering | 8.5 | 8.5 | 8.5 | 9 | 9 | 7.5 | 5.5 |
| Consistency with approved pages | 8 | 8 | 9.5 | 9.5 | 9.5 | 4 | 4.5 |
| Accuracy signals | 8.5 | 7.5 | 9 | 9 | 9 | 7.5 | 7.5 |
| Admin setup | 9 | 7.5 | 7.5 | 7 | 6.5 | 6.5 | 5 |
| **Average** | **7.9** | **7.4** | **8.75** | **8.75** | **8.4** | **6.1** | **6.0** |

1. **Take a payment (Visuals).** The cashier needs help most while the card is on the reader, and that moment has no screenshot. The page's only checkout shot is the pane before sending, with just 3 labels: the tile, the reader buttons and Send. Step 4 and the paragraph after the steps describe screens the cashier never sees on the page: *Waiting for the customer on the terminal*, the ticks for Sent, On terminal, Approved and Captured, **Cancel on terminal**, and **Payment failed** with **Try again** and **Choose another way**.
   **Smallest fix:** add one labelled shot of the pane in progress, placed after step 4. Label the status line, the four ticks, **Cancel on terminal** and the reader that was chosen.

2. **Set up in WP Admin, steps 4–6 (Visuals / Accuracy signals).** Several things go wrong with the POS connections shot:
   - It shows both reader boxes ticked. Step 5 and *Smart readers, Bluetooth or both* say that setup leaves Bluetooth readers unused, so it's the one state the text warns against.
   - Label 1 is on the first box only.
   - The shot sits below step 6's "Then check the page" list instead of next to steps 4–5, which it actually shows.
   - On a phone, the field names and helper text in it can't be read.

   **Smallest fix:** retake it with only **Smart readers** ticked and label both boxes. Move it to sit right after step 5, and crop it tighter so it can be read on a phone.

3. **Set up in WP Admin, step 3 and "Then check the page" (Admin setup).** The page tells the admin three ways to confirm setup worked: **Stripe API key is valid.**, **Signing secret stored.** and the locations list. None of them is shown in a screenshot. The key shot instead shows empty fields, and label 2 points to a "How to get this key" block whose text is too small to read at either width.
   **Smallest fix:** retake the key shot after saving, with the saved key showing as dots, *(saved; leave blank to keep)* and **Stripe API key is valid.** visible. Move label 2 to that validity line. If the Signing secret row fits in the frame, label it as well.
