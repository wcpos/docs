# WCPOS 2.x docs style guide (draft for Paul, roadmap#534)

**Status: draft.** Paul rules on it once, together with the two templates in `docs/templates/` and `docs/sidebar-board.md`. Until he does, judges and writers use the three proof pages and the rulings below; this file binds nothing.

Every docs ticket cites a line of this guide instead of restating style. A review finding against style names the line it breaks.

**The three proof pages are the exemplars.** Read them before writing:

- J1 *Open the Register*: `versioned_docs/version-2.x/pos/register/index.mdx` (#539)
- J2 *Checkout*: `versioned_docs/version-2.x/pos/checkout/index.mdx` (#514)
- J12 *Product Panel*: `versioned_docs/version-2.x/pos/product-panel/index.mdx` (#540)

Where this guide and a proof page differ, the proof page wins. Where a proof page and a ruling differ, the ruling wins.

**Sources**, cited after each rule in brackets: **#512** the 2.0 journeys map; **#522** and **#526** the docs-order and docs-sweep rulings; **#534** this ticket, its J2 amendment of 2026-11-05 and Paul's comment of 2026-11-06; **brief** Paul's hill-climb brief of 2026-11-07; **proof** what the three proof pages do; **ledger** the docs completeness ledger (#525); **digest** the climb's candidate style digest, kept only where no proof page or ruling says otherwise.

## The north star

> *"how do we make the best app for the average cashier, how do we make it easy and intuitive to use, without sacrificing complexity. We hide complexity not remove it."* (Paul, #512, binding through #526)

> *"Lots of images and call out boxes. Diagrams and flow charts where it helps. Use every best practice in the book for documentation. The goal is not to bloat the docs, it is to simplify and hide complexity in deeper layers of the docs."* (Paul, map Notes, quoted on #534)

## Readers, in order

1. **The average cashier.** Not technical, the page open on a phone or tablet beside the till. Every page under *Using the POS* is written for them first. [#526 §6, #534, brief §3]
2. **The owner-operator**, setting up and managing: Settings, WordPress Admin, Hardware, Payment Gateways, Receipts and *Managing Your Store*. They also read the cashier pages when they train staff. [#526 §6]
3. **The developer**, last and tucked away under *Developer Reference*. [#526 §6, `CONTEXT.md`]

### Question for Paul: amending `CONTEXT.md`

#526 §6 says `CONTEXT.md`'s Owner/Operator definition is amended to match this order. Today it says there is "one blended persona" and warns against treating the cashier as a separate audience. This draft does not edit `CONTEXT.md`. Proposed wording, for Paul to accept or change:

> **Cashier**: The first docs reader: the average cashier at the till, not technical, reading on a phone or tablet beside the register. Task pages under *Using the POS* are written for them. Settings, capabilities and edge cases reach them only as links down.
>
> **Owner/Operator**: The second reader: a small-business owner who installs, configures and runs WCPOS. Technically capable but not a software developer. Setup and management sections are written for them, and they read the cashier pages when training staff.
> _Avoid_: writing a cashier page in the owner's vocabulary (settings, capabilities, roles) except where a link down carries it.

## Layers: what goes on a task page, what goes a layer down

> *"This is exactly what I mean by hiding complexity."* (Paul on the J2 shape, #534 comment)

**A task page** is one job from start to finish, in the order the cashier does it. [#522 §2]

- It starts basic: what the cashier sees and taps. [#534 comment]
- A one- or two-sentence lead says what the page walks through ("This page walks through one session, from a closed register to the closure"). [proof: J1, J2, J12]
- A `:::note` at the top only when something must be true first (J1 and J2: **Open and close the register**). [proof]
- One H2 per step, each with its capture and legend. A step with no screen of its own can be prose and a short list (J12 *Scan a barcode*). [proof]
- One short failure section near the end. [#522 §2, proof]
- Every option, setting, status, Pro variant, edge case and error code is *reachable* from the page through a link, never deleted from it. [#526 north star, brief §3 "layering"]

**A leaf** is one subject a layer down, with a name a cashier would search for. Each layer down is more specific, with more examples and the technical detail for troubleshooting. [#534 comment]

- **No catch-all leaf.** *"I am not a big fan of putting things under a page like 'Checkout in Detail'. This page covers too much information and it is too vague. I would rather it splits into multiple pages."* Never "X in Detail", "Advanced X" or "More about X": split it. [#534 comment]
- What moves down: every status chip and what it means; every setting that changes the task, and its default; Pro variants; the edge cases and error codes behind a failure entry; the per-vendor detail of a card reader. [#522 §2]
- A leaf may be longer than a task page. It still opens with what the subject is in one or two sentences, then goes from common to rare.

**Inside the lines.** A ticket may add, rename and nest leaves inside its own journey or area without asking. Moving a page between top-level sections, or renaming a section, is the cross-page ticket's job and comes to Paul as one before-and-after tree. [#526 §3]

## When a capture earns its place

> Fewer captures, more labels: *"the model is the nine-label linked shot on 'Checkout in Detail', not one-pin step shots. Most labels link to the page that explains the control."* (#534 amendment, from Paul's J2 review on #514)

- A task page is image-led: each step that has a screen gets one densely labelled capture. [#522 §2, #534]
- **Labels:** a working screen carries as many labels as the cashier's eye needs: five to ten on the proof pages. A shot with one or two labels where nine would teach is a fault. A final confirmation state may carry two (J1 *Closure N written*). [brief §3, proof]
- Use `JourneyShot` with the page's capture manifest, and a `<div className="pinned-legend">` numbered list straight after it. Numbers follow the manifest's pins. [#521 via #522, proof]
- Each legend entry is `**Label** — what it does. See [Page](link).` The label is the app's own words where the screen has them; an unlabelled region gets a plain name (**Register bar**, **A product tile**). Most entries link down. [#534, proof]
- Use `offsets` so a pin never covers what it points at. Pin and label highlight together on hover, both ways (component rule). [#534 comment]
- `alt` says what the screen shows, in the order the legend reads. [proof]
- Captures show the **Standard Receipt** unless the page is about thermal receipts. [#534 amendment]
- Captures come from the journey modules, shot on the showcase store per capture (`store` and `variant` in the manifest). No probe or test names in frame. Tablet is the default; add phone only where the layout differs. [#522 §5–§6]
- Never a 1.x screenshot on a 2.x page, and no `{/* Screenshot: … */}` placeholder left behind. [ledger IA 9]

## When a call-out earns its place

Zero to two per task page. Body text never goes in a call-out. [proof: J1 and J2 have two, J12 none; brief §3 "structure"]

| Kind | Use it for |
|---|---|
| `:::note` | A precondition the task depends on, at the top. |
| `:::tip` | A shortcut that saves time. |
| `:::warning` | Something that loses money or data. |
| `:::info With WCPOS Pro` | What Pro adds, at the end of a task page. |
| `:::info Pro Feature` | At the top of a leaf that is Pro-only. |

A short Pro mark inside a legend entry is also fine: "**Legacy** tab (WCPOS Pro)". [proof: J1, J2] No "New in vX" or "Changed in vX" call-outs: no feature history. [digest]

## When a flow chart earns its place

Only where the path branches in a way prose cannot carry. The J2 checkout chart did not earn its place, and none of the three proof pages has one. Most task pages need none; a leaf about one branching decision (what a scan does with zero, one or many matches) may. Use a `mermaid` block (`@docusaurus/theme-mermaid`), with node text in the app's words. [#534 amendment, #522 §2]

## The length and image floor

#526 says the proof page sets these numbers, and sweep 3 tests every task page against them. The three proof pages measure (approximate prose words, imports and components excluded; the count moves by about 8% with how words are split):

| Page | Words | Captures | Labels per capture | H2 sections | Call-outs |
|---|---:|---:|---|---:|---:|
| J2 Checkout | 779 | 3 | 9, 8, 8 | 5 | 2 |
| J1 Open the Register | 1,057 | 4 | 6, 6, 9, 2 | 6 | 2 |
| J12 Product Panel | 974 | 2 | 10, 5 | 5 | 0 |

Proposed floor for a task page, for Paul to rule on:

- **Images:** at least two captures, one per step that has a screen of its own, and at least five labels on every capture of a working screen.
- **Length:** 600 to 1,200 words of prose. Under 600, something a cashier needs is probably missing; over 1,200, something belongs a layer down.
- **Shape:** a lead, one H2 per step, a failure section, Related Documentation.

The completeness *thin* floor that sweep 1 exits on (#526 §1) is not set by this draft; it is a separate number for Paul.

## Claims

> *"I wouldn't necessarily take the way the app works as being 100% correct."* (Paul, #526 §5)

- Every claim is checked against the app on the capture store, or against the ruling that governs it. [brief §2, #526 §5]
- A statement about default behaviour names the setting that controls it and links to its page. J2 once said "Guest" four times where the default customer is a setting; now it says "your store's default customer" and links **Default POS Customer**. [#534 amendment]
- Use the app's exact labels, in bold. Never a 1.x label. [digest, ledger IA 10]
- When the app and a ruling disagree, the page follows the ruling and carries the hidden marker below. An unruled oddity is one question for Paul; the page ships without that paragraph rather than guessing. [#526 §5]

## The hidden `pending:` marker

Something ruled but not yet shipped, or a bug that makes the app differ from the ruling, gets a hidden marker on the paragraph:

```mdx
{/* pending: monorepo#1234 */}
The figures arrive before you count.
```

- Never a reader-facing note, a promise or "coming soon". [#526 §5]
- The bug is filed in the monorepo with the `docs-conflict` label and the docs ticket linked; the ledger row stays `blocked`; the capture is re-shot when the fix lands. [#526 §5]
- **Lint:** a build contract test refuses the AT LAUNCH flip while any `pending:` marker remains, and sweep 2 exits only when every marker names an open issue. That test does not exist yet in `wcpos/docs`; it belongs to the sweep-4 cross-page ticket. [#526 §1, §5]

## Page furniture

- Frontmatter: `title`, `sidebar_label`, `sidebar_position`, and `description` in double quotes. [proof]
- Every heading carries an explicit anchor: `## Count and close {#close}`. [proof]
- Headings name what the cashier does in plain words ("Move cash in and out", "Choose a variation"). A screen the cashier opens may be named for itself ("Your cashier sheet"). [proof]
- The failure section is `## If something goes wrong {#goes-wrong}`, or names the task's own failure ("When you can't find it"). Each entry is a **bold symptom**, in the words the screen uses, then what to do and a link. Paragraphs or a bullet list both work. [proof]
- Links in the body are relative `.mdx` paths with anchors; `LinkCard` takes a route. [proof]
- End with `## Related Documentation {#related-documentation}` and `LinkCards`, up to three cards. A task page whose leaves are many may list them in a bullet list first (J2). [proof]

## Voice

Short sentences. Second person, present tense. Plain words a cashier says out loud: "the POS", "the register", "the cart", "the till", "the drawer". No product internals, no marketing, no "simply", no "just", no feature history. Name an error code where the screen shows one and link it. Never write the old two-word product name; it is **WCPOS**. [digest, brief §3, brief §7]

## The **Walked** section in every docs PR body

Every docs PR body carries it. [#526 §4, #534 amendment]

```markdown
## Walked

- **Site and build:** demo.wcpos.com (Pro), app 2.0.0-beta.N, plugin x.y.z
- **Journey and steps:** J2 steps 1–7, headed, against the showcase store
- **Settings read:** Default POS Customer, Use Cashier Account, Checkout > payment methods
- **Not walked, and what backs it:** card reader flow (Stripe test mode, ruling #NNN)
- **Not reached:** Mollie (no sandbox)
```

A feature with no journey yet is walked by hand on the showcase store, and the section says so. Sweep 1 walks before writing; sweep 2 walks with the page open; sweep 3 walks as a new cashier from the page alone. [#526 §4]

## Where pages may differ

Judges must not reward sameness for its own sake (brief §6, hazard 2), and the brief asks this guide to name where pages may differ. Proposed, for Paul to rule on: a page may leave the J2 shape where the task does: offline, hardware and payment-gateway pages follow the device or the vendor's own steps, and a page about a screen the cashier only reads (Reports, the customer display) may have one capture and no failure section. It still keeps the reader order, the layering, the labelling and the claims rules.
