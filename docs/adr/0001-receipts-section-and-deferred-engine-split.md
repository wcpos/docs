# Receipts is a first-class section; the shared template engine stays inside it until a second output type ships

Status: accepted (2026-05-30)

## Context

The original request was to rename the **Templates** section to **Receipts** and redirect
`/templates/* → /receipts/*`. Auditing the roadmap (wcpos/projects/4) showed the template
engine — logicless HTML + thermal XML, the canonical receipt-data contract, the gallery —
will render more than receipts: **email templates** and **report templates** are explicit
backlog items. A plain rename to "Receipts" would box those future outputs out of their own
section.

## Decision

1. **Reject the simple rename.** Instead, *break Templates apart*:
   - `printer-setup` → moves to a new top-level **Hardware** section (it's device setup,
     shared by receipts now and reports later).
   - everything else (customise, HTML/thermal syntax, receipt-data, gallery, plus
     `pos/checkout/receipts`) → a first-class top-level **Receipts** section.
2. **Name the section "Receipts"** — plain language, highest findability; it is one of the
   most-searched Owner/Operator topics. Not "Templates" (jargon) and not "Receipts &
   Printing" (printing moved to Hardware).
3. **Keep the shared template-engine pages inside Receipts for now.** Today receipts are the
   engine's only consumer, so a separate shared-engine section would be a section-of-one.
4. **Deferred split, on an explicit trigger:** when the *second* output type (Email or
   Report templates) ships, factor the shared engine pages out into a "Templates & Printing"
   (or similar) section that all output types reference. This is **additive** — "Receipts"
   is never renamed; engine pages (deep, low-traffic URLs) just move, with cheap redirects.

## Consequences

- "Receipts" is a permanent, stable name; no future rename of the high-traffic section.
- One known future refactor (extract engine pages) is accepted in exchange for avoiding
  premature abstraction now. The trigger is recorded so it isn't forgotten.
- URL/redirect/i18n cost (12 locales) lands once now for the Templates→Receipts move, and a
  smaller additive move later for the engine extraction.
