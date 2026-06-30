# Printer Setup Wizard — Phase 2 (Cloud Branch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the cloud-printing branch to the wizard — a top-level "where is the printer?" fork (local vs cloud) and four provider sub-trees (Star CloudPRNT, Epson Server Direct Print, PrintNode, Star Online), each with setup steps, status gates, and provider-specific troubleshooting, all as translatable MDX.

**Architecture:** No new engine code. Reuse the existing node components (`WizardQuestion/WizardChoice/WizardStep/WizardGate/WizardFix/WizardInvalid/WizardFigure/WizardTerminal`) from Phase 1. The cloud content is authored in the same `printer-setup-wizard.mdx` page. The new root question becomes the wizard's start node (engine `startId` = first navigable node in document order).

**Branch:** `feat/printer-wizard-cloud`, branched from `feat/printer-wizard` (Phase 1, PR #300 — unmerged). PR bases on `feat/printer-wizard`; merge after #300.

**Source of truth for cloud content:** `versioned_docs/version-1.x/receipts/cloud-printing.mdx` (provider setup steps, status table, troubleshooting accordion) and design spec §7.5 + ecosystem KB FM-20. The plan authors the Star CloudPRNT sub-tree in full as the model; the other three follow the same node shape with content transcribed from those sources (concrete per-provider specs given in Task 4).

**Hard constraints (unchanged from Phase 1):** all visible text is `children` or a double-quoted `TEXT_PROPS` prop; no `caption=`; no single-quoted translatable props; machine props carry no prose; explicit heading anchors; `onBrokenLinks: throw` across 12 locales. **Multi-word cloud brand names used as `label=`/`title=` MUST be allowlisted (Task 1) or the translation gate fails and the Aide sweep loops.**

---

## Setup (execution-time)

```bash
git -C /Users/kilbot/Projects/docs worktree add -b feat/printer-wizard-cloud ../docs-printer-wizard-cloud feat/printer-wizard
cd ../docs-printer-wizard-cloud
corepack pnpm install
```

The Phase 1 wizard (engine + components + the local MDX page) is present on this branch. Read `src/components/PrinterWizard/nodes.js` for the node prop contracts and `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx` for the existing authored tree.

---

## Task 1: Allowlist the multi-word cloud brand names (BLOCKING — do first)

**Files:**
- Modify: `scripts/check-translation-completeness.js` (`UNTRANSLATED_PROP_ALLOWLIST`)
- Test: `scripts/__tests__/check-translation-completeness.test.js` (existing — must still pass)

The cloud sub-trees use these multi-word brand strings as `label=`/`title=` values. Several may already be present (e.g. `Star CloudPRNT`). Any that are multi-word and NOT present will fail the completeness gate and loop the Aide sweep.

- [ ] **Step 1: Check which brand strings are already allowlisted**

Run: `grep -nE "Star CloudPRNT|Epson Server Direct Print|Star Online|Star Document Markup|Server Direct Print" scripts/check-translation-completeness.js`
Note which of these exact strings are present in `UNTRANSLATED_PROP_ALLOWLIST`.

- [ ] **Step 2: Add the missing multi-word cloud brand strings**

Edit `UNTRANSLATED_PROP_ALLOWLIST` in `scripts/check-translation-completeness.js` to ensure these exact strings are present (add only the missing ones, preserve existing entries and formatting):
`Star CloudPRNT`, `Epson Server Direct Print`, `Star Online`, `Star Document Markup`.
(`PrintNode` and `Epson`/`Star` are single words — never flagged — do NOT add them.)

- [ ] **Step 3: Run the existing gate test suite**

Run: `corepack pnpm test scripts/__tests__/check-translation-completeness.test.js`
Expected: PASS (the allowlist is data; adding entries must not break existing tests).

- [ ] **Step 4: Commit**

```bash
git add scripts/check-translation-completeness.js
git commit -m "chore(i18n): allowlist cloud-print brand names for the wizard"
```

---

## Task 2: Add the root "where is the printer?" fork

**Files:**
- Modify: `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

The current start node is the `platform` question. Insert a new root question ABOVE it so it becomes the start node; "local" routes into the existing `platform` flow, "cloud" routes to the new provider fork.

- [ ] **Step 1: Insert the root question as the first child of `<PrinterWizard>`**

Immediately after the intro paragraph and `<PrinterWizard>` opening tag, BEFORE the existing `<WizardQuestion id="platform" ...>`, add:

```mdx
  <WizardQuestion id="where" title="Where is the printer?">
    <WizardChoice value="local" label="Right here — plugged into or on the same network as this till" goTo="platform" />
    <WizardChoice value="cloud" label="Somewhere else — another room, another site, or shared by every device" goTo="cloud-provider" />
  </WizardQuestion>
```

- [ ] **Step 2: Verify the start node changed and the build is green**

Run: `corepack pnpm docusaurus build --locale en`
Expected: SUCCESS. The wizard now opens with "Where is the printer?". (The engine's `startId` is the first navigable node — now `where`.) `cloud-provider` does not exist yet, so dev mode would log a graph warning; the BUILD does not fail on graph warnings (they are `console.warn`), but you will add `cloud-provider` in Task 3, so a temporary dangling reference is acceptable between Task 2 and Task 3. Do NOT commit a dangling graph — commit Task 2 together with Task 3, or add a minimal placeholder `cloud-provider` terminal now and replace it in Task 3. Prefer: commit Tasks 2+3 together.

- [ ] **Step 3:** (commit folded into Task 3)

---

## Task 3: Author the cloud provider fork + the Star CloudPRNT sub-tree (the model)

**Files:**
- Modify: `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

- [ ] **Step 1: Add the provider fork and the Star CloudPRNT sub-tree**

After the local branch's `support` terminal (or anywhere inside `<PrinterWizard>` after the `where` question), add:

```mdx
  <WizardQuestion id="cloud-provider" title="Which cloud printing service does your printer use?">
    <WizardChoice value="star-cloudprnt" label="Star CloudPRNT (Star printer, polls for jobs)" goTo="cloud-star-cloudprnt" />
    <WizardChoice value="epson-sdp" label="Epson Server Direct Print" goTo="cloud-epson-sdp" />
    <WizardChoice value="printnode" label="PrintNode (any printer, via a desktop client)" goTo="cloud-printnode" />
    <WizardChoice value="star-online" label="Star Online (stario.online account)" goTo="cloud-star-online" />
    <WizardChoice value="unsure" label="I'm not sure" goTo="cloud-which" />
  </WizardQuestion>

  <WizardInvalid id="cloud-which" title="Which provider is right for you?">
Pick the one that matches your hardware: a **Star** thermal printer that polls for jobs is **Star CloudPRNT**; a Star printer registered at stario.online is **Star Online**; an **Epson** ePOS printer is **Server Direct Print**; and **any** printer attached to a computer can use **PrintNode**. Full comparison: [Cloud Printing](/receipts/cloud-printing#providers).
  </WizardInvalid>

  <WizardStep id="cloud-star-cloudprnt" title="Set up Star CloudPRNT">
Cloud printers are configured once in **WP Admin &gt; POS &gt; Settings &gt; Cloud Print** and shared across every device.

1. Add a printer and choose **Star CloudPRNT** as the provider. WCPOS generates a **poll URL** and a **one-time token**.
2. Copy them — the **token is shown only once** (regenerate from the printer card if you lose it).
3. Open the printer's **CloudPRNT** settings, paste in the poll URL and token, set a poll interval (a few seconds), then save and reboot the printer.

Star CloudPRNT needs a **thermal** template — see [Thermal Templates](/receipts/thermal-templates).

    <WizardGate id="g-cloud-cp-status" question="Within a poll cycle, did the printer's status in WCPOS change from Waiting to Connected?">
      <WizardChoice value="yes" label="Yes, it shows Connected" goTo="cloud-cp-test" />
      <WizardChoice value="no" label="No, it's stuck on Waiting" goTo="fix-cloud-waiting" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="fix-cloud-waiting" title="Printer stuck on Waiting">
A polling printer stuck on **Waiting** has never reached WCPOS. Check:

- The **poll URL and token** in the printer match WCPOS exactly — one wrong character rejects every poll. If unsure, regenerate the token and re-enter it.
- The printer can reach your site over the internet (DNS, no firewall blocking outbound HTTPS, a valid SSL certificate on your store).
- **Polling is enabled** in the printer's CloudPRNT settings with a sensible interval. Reboot the printer after changing settings.

    <WizardGate id="g-cloud-cp-retry" question="After re-checking and rebooting, does it show Connected now?">
      <WizardChoice value="yes" label="Yes" goTo="cloud-cp-test" />
      <WizardChoice value="no" label="Still stuck on Waiting" goTo="support" />
    </WizardGate>
  </WizardFix>

  <WizardStep id="cloud-cp-test" title="Send a test print">
On the printer's card in **Cloud Print**, click **Test print**.

    <WizardGate id="g-cloud-cp-test" question="Did the test print come out of the printer?">
      <WizardChoice value="yes" label="Yes" goTo="cloud-done" />
      <WizardChoice value="no" label="No" goTo="fix-cloud-template" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="fix-cloud-template" title="Connected, but the test print didn't arrive">
If the status is Connected but nothing prints, the most common cause is the **template**. Star and Epson cloud printers can only use **thermal** templates (the job is rendered to the printer's native commands). If your template isn't selectable or nothing prints, assign a [thermal template](/receipts/thermal-templates), or use a **PrintNode** printer, which prints any template via PDF.

    <WizardGate id="g-cloud-template-retry" question="With a thermal template assigned, did the test print work?">
      <WizardChoice value="yes" label="Yes" goTo="cloud-done" />
      <WizardChoice value="no" label="Still nothing" goTo="support" />
    </WizardGate>
  </WizardFix>

  <WizardTerminal id="cloud-done" kind="success" title="Cloud printer ready">
Your cloud printer is connected and printing. It appears automatically in every device's printer list — you don't add it per device. To print automatically, set up an [auto-print rule](/receipts/cloud-printing#auto-print).
  </WizardTerminal>
```

- [ ] **Step 2: Cross-check graph integrity and build**

Run the goTo-vs-id cross-check on the file (`grep -oE 'goTo="[^"]+"'` vs `grep -oE ' id="[^"]+"'`). Every cloud `goTo` target must resolve (`cloud-provider`, `cloud-which`, `cloud-star-cloudprnt`, `cloud-epson-sdp`, `cloud-printnode`, `cloud-star-online`, `fix-cloud-waiting`, `cloud-cp-test`, `fix-cloud-template`, `cloud-done`, plus the shared `support`). Note: `cloud-epson-sdp`, `cloud-printnode`, `cloud-star-online` are added in Task 4 — until then they dangle. Author Task 4 before committing/building clean, OR add minimal stubs now.

Run `corepack pnpm docusaurus build --locale en` after Task 4 for a clean build.

- [ ] **Step 3:** (commit folded into Task 4 so the graph is never committed dangling)

---

## Task 4: Author the remaining three provider sub-trees

**Files:**
- Modify: `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

Follow the EXACT node shape of `cloud-star-cloudprnt` (Step → status Gate → Fix → test Gate → shared `cloud-done` / `support`). Transcribe the per-provider content from `versioned_docs/version-1.x/receipts/cloud-printing.mdx` and spec §7.5. Concrete content per provider:

- [ ] **Step 1: Epson Server Direct Print** (`id="cloud-epson-sdp"`)
  - Same as Star CloudPRNT but: provider **Epson Server Direct Print**; paste poll URL + token into the printer's **Server Direct Print** settings; jobs delivered as ePOS-Print XML; thermal template required; status gate **Waiting → Connected**; reuse `fix-cloud-waiting` (point its retry to `cloud-cp-test`? No — author a parallel `g-cloud-sdp-status` gate routing "no" to `fix-cloud-waiting` is fine since the fix is provider-neutral) and `fix-cloud-template`; success → `cloud-done`.
  - Reuse the shared `fix-cloud-waiting` and `fix-cloud-template` fixes (they are provider-neutral) by pointing the Epson status/test gates' "no" choices at them, and route their success back to `cloud-cp-test`/`cloud-done`. Keep one test step per provider (`id="cloud-epson-test"` → reuse `fix-cloud-template`).

- [ ] **Step 2: PrintNode** (`id="cloud-printnode"`)
  - Steps: install the **PrintNode desktop client** on a computer that can already print to the target and sign in (must stay running/online); create a **PrintNode API key**; add a printer in Cloud Print, choose **PrintNode**, paste the API key; select the target printer from the list; save.
  - Status gate: does the card show **Online**? "no" → a PrintNode-specific fix (`fix-cloud-printnode`): client running + online (computer not asleep / client not closed), correct printer selected, API key valid/not revoked.
  - PrintNode prints **any** template (PDF) — note this advantage. Success → `cloud-done`.

- [ ] **Step 3: Star Online** (`id="cloud-star-online"`)
  - Steps: in stario.online open **Device Groups**, copy the group's **CloudPRNT URL** (note the region: `device.stario.online` vs `eu-device.stario.online` — wrong region causes a 401); create an API key with **EnumDevices, ViewDevice, PrintToDevice, ViewDeviceGroups**; add a printer, choose **Star Online**, paste the URL + API key, click **Fetch my devices**; select the device; save.
  - Gate: did **Fetch my devices** return devices? "no" → fix `fix-cloud-star-online`: 401 = key not accepted (mis-copied/revoked/wrong account or **region**); 403 = key lacks permission (enable EnumDevices + PrintToDevice); empty list = Device Group has no connected device or the URL points to a different group.
  - Then status (Online/Offline/Unknown) + test → `cloud-done`/`support`. Thermal template required.

- [ ] **Step 4: Cross-check + clean build**

Run the goTo-vs-id cross-check — every target resolves, nothing dangles. Run `corepack pnpm docusaurus build --locale en` → SUCCESS (onBrokenLinks; the cloud links to `/receipts/cloud-printing`, `/receipts/cloud-printing#providers`, `/receipts/cloud-printing#auto-print`, `/receipts/thermal-templates` must all resolve). Run `corepack pnpm test` → 165 pass (no engine changes).

- [ ] **Step 5: Commit Tasks 2–4 together (one coherent cloud-content commit)**

```bash
git add versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx
git commit -m "feat(printer-wizard): cloud branch — local/cloud fork + 4 provider sub-trees"
```

---

## Task 5: i18n gate, full 12-locale build, PR

**Files:** none (validation + ship)

- [ ] **Step 1: Brand-label scan + gate**

Run `grep -nE '(label|title|question|summary)="[^"]*"' versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx` and confirm every multi-word brand value is in the allowlist (Task 1). Then run `node scripts/check-translation-completeness.js --changed` — must PASS for the English source.

- [ ] **Step 2: Full 12-locale build + tests**

Run `corepack pnpm build` (all 12 locales, `onBrokenLinks: throw`) → SUCCESS. Run `corepack pnpm test` → 165 pass.

- [ ] **Step 3: Push and open the stacked PR**

```bash
git push -u origin feat/printer-wizard-cloud
gh pr create --base feat/printer-wizard --title "feat: printer wizard (phase 2 — cloud branch)" \
  --body "Adds the cloud-printing branch to the wizard (depends on #300): a local/cloud root fork and four provider sub-trees (Star CloudPRNT, Epson Server Direct Print, PrintNode, Star Online) with setup steps, status gates, and provider-specific troubleshooting. No engine changes. Multi-word cloud brand names allowlisted for the translation gate. Full 12-locale build green; 165 tests pass. Merge AFTER #300."
```

Run `gh pr view --json url,number,isDraft,baseRefName` to confirm it's a ready PR based on `feat/printer-wizard`.

---

## Self-review notes (author's checklist)

- **Spec coverage (§7.5):** local/cloud fork → Task 2; Star CloudPRNT → Task 3; Epson SDP / PrintNode / Star Online → Task 4; status gates (Waiting→Connected / Online / Fetch-my-devices) and CFM fixes (stuck-on-Waiting, template-not-selectable, PrintNode-offline, Star-Online 401/403/empty/region) → Tasks 3–4; brand allowlist (blocking) → Task 1; build/gate → Task 5.
- **No new engine code** — reuses Phase 1 node components verbatim; 165 tests unchanged.
- **Graph integrity** — the dangling-reference windows between Tasks 2–4 are explicitly called out; commit only when the graph cross-check is clean (Tasks 2+3+4 committed together).
- **Reused fixes** — `fix-cloud-waiting` and `fix-cloud-template` are provider-neutral and shared by Star CloudPRNT and Epson SDP; PrintNode and Star Online get their own provider-specific fixes.
- **No placeholders** — the Star CloudPRNT sub-tree is authored in full; the other three have concrete per-provider content specs sourced from `cloud-printing.mdx`, not "same as Task N".
