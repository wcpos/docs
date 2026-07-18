# WCPOS Documentation

The documentation site for WCPOS (docs.wcpos.com). This glossary fixes the
vocabulary used to describe the docs' information architecture and its intended readers, so
category names, audience assumptions, and structure decisions stay consistent.

## Language

### Structure

**Guides vs Developer Reference**:
The docs are one sidebar of task-oriented **Guides** for the **Owner/Operator**, with a
single collapsed **Developer Reference** area at the bottom and **Error Codes** kept inside
the Guides (it's troubleshooting). No audience-segmented navbar tabs — there is one blended
reader, so one main path.

**Using the POS vs Managing Your Store**:
The two core guide buckets, divided by *when* the task happens. **Using the POS** = live
register operations done during a sale, facing a customer (product panel, cart, checkout,
coupons at the till, refunds, end-of-day reconciliation). **Managing Your Store** = working
on business data away from an active sale (products, order history, customers, stores).
_Boundary rule_: "is this done during a live sale?" → Using the POS; "is this editing
business data / config?" → Managing Your Store. Setup of outputs/devices/payments is
neither — those are their own top-level sections (Receipts, Hardware, Payment Gateways).

### Readers

**Owner/Operator**:
The primary docs reader — a small-business owner who installs, configures, and runs WCPOS
themselves. Technically capable but not a software developer; will happily install a
payment gateway or edit a receipt template, but is not writing plugins.
_Avoid_: treating "Cashier" and "Developer" as separate primary audiences. There is one
blended persona; the docs are written for them first.

**Developer**:
A secondary, minority reader who extends WCPOS in code (custom payment gateways, REST API
integrations). Served by a small, tucked-away reference area — never at the expense of the
Owner/Operator's path.

### Payments

**Payment Gateway**:
A payment method an Owner/Operator can enable in WCPOS — e.g. Stripe Terminal, SumUp,
Vipps MobilePay, email invoice, web checkout. The setup guides are user-facing tasks.
_Avoid_: "Custom Gateway" as a user-facing label — it reads as "build your own" and hides
the setup guides from Owner/Operators. Reserve build-your-own scaffolding (the gateway
template) for **Developer Reference**.

### Settings

**Settings (global)**:
Configuration that applies backend-wide or app-wide — the central **Settings** section.
Two kinds: **WordPress Admin Settings** (backend, `WP Admin > POS > Settings`) and **POS
Store Settings** (app-wide, in the POS Settings menu: tax, barcode, hotkeys, theme).

**Display Settings (per-screen)**:
Configuration that belongs to one POS screen (e.g. which columns are visible), set inline
on that screen via the sliders icon — not in the central Settings section. Documented
*with that screen's task docs* (under Using the POS / Managing Your Store), not under
Settings. _Boundary rule_: co-locate per-screen config with the task; centralize only
global config.

### Hardware

**Hardware**:
A top-level section for connecting physical devices. Its overview page is a **hub** that
lists *all* device types an Owner/Operator might use — receipt printers, barcode scanners,
card readers/terminals, tablets, cash drawers — so nobody browsing for gear hits a dead
end. Devices with real setup content (receipt printers, barcode scanners) get their own
pages here; devices whose setup belongs elsewhere (card readers → **Payment Gateways**)
are **one-line pointers** on the hub, not setup instructions.
_Boundary rule (hub-and-spoke)_: one canonical home per page. The Hardware hub may *point*
to a device's setup page but must never duplicate the steps. A card reader's account +
pairing flow is one continuous task and lives only on its Payment Gateway page.

### Templating & output

**Template Engine**:
The shared rendering system (logicless HTML + thermal XML, Mustache-style placeholders,
the canonical receipt-data contract) that turns POS data into a printed/displayed/emailed
document. Per the roadmap it will feed *many* output types — receipts today; emails,
reports (X/Z), labels, packing slips, kitchen tickets, customer-facing display next.
_Key framing_: the engine is shared **infrastructure**; a **Receipt** is just its first
output type. Don't let docs imply the engine belongs to receipts alone.
_Avoid_: "Templates" as a user-facing section name that hides receipts; and "Receipts" as
an umbrella that boxes out reports/emails/labels.

**Receipt**:
One output type of the **Template Engine** — the document a customer gets after a sale
(printed, or emailed/SMS as a digital receipt). A high-traffic Owner/Operator topic in its
own right, distinct from the engine that renders it. The top-level **Receipts** section
currently *also* hosts the shared engine docs; these get extracted when a second output
type (email/report templates) ships — see ADR-0001.

### Content types

**Error Codes**:
User-facing **troubleshooting** reference, reached when an error appears in the app —
mostly via search or an in-app link, not by browsing. Must stay inside the main,
search-indexed, user-facing docs. _Avoid_: filing under "Developer Reference"; an Owner/
Operator looks these up constantly.

**Developer Reference**:
Deep technical lookup material for people extending WCPOS in code (REST API internals,
architecture, role/endpoint access, custom-gateway scaffolding). The only content safe to
"tuck away" from the Owner/Operator's main path.
_Avoid_: conflating with **Error Codes**, which is troubleshooting, not extension material.
