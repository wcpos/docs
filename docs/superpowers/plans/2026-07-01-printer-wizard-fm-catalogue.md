# Printer Setup Wizard — FM Catalogue Depth (garbled / cash-drawer / network)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Deepen the wizard's self-service troubleshooting by adding the highest-value missing failure modes from the ecosystem KB: a **wrong-characters/garbled** diagnostic (currently absent — only blurry-vs-crisp exists), a **cash-drawer** branch (absent entirely), and **deeper network** troubleshooting (single-session 9100, ePOS-disabled/model, idle-sleep, Wi-Fi band). All additive MDX on the existing engine — **no engine changes**.

**Branch:** `feat/printer-wizard-fm-catalogue`, from `main` (all prior wizard PRs #300–302 merged). PR → `main`.

**Content sources:** ecosystem KB `docs/superpowers/specs/2026-06-30-printer-wizard-ecosystem-kb.md` (FM-3 garbled, FM-7 cash drawer, FM-9 RAW/9100, FM-15/16 buffer/serial garble, FM-18 single-session, FM-19 ePOS/model, FM-10/11 Wi-Fi, idle-sleep) and `versioned_docs/version-1.x/hardware/printers.mdx` (command languages, cash drawer DK port, widths, ports). Match the existing node shape in `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx` (self-closing `<WizardChoice/>` inside `<WizardGate>`).

---

## Current convergence (to extend)

Today every successful test print flows: `g-testprint` (yes) → `g-width` (→`fix-width`) → `g-crisp` (→`fix-crisp`) → `done`. The web/BT/USB paths' success gates also route into `g-width`. We insert two new quality gates **after `g-crisp`** so all paths benefit: `g-chars` (correct characters) and `g-drawer` (cash drawer), then `done`.

New chain: `… → g-crisp (yes) → g-chars (yes) → g-drawer (no-drawer/works) → done`.

---

## Task 1: Garbled / wrong-characters branch

**Files:** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

- [ ] **Step 1: Reroute `g-crisp`'s success into `g-chars`, and add the garbled branch.**

Find the `g-crisp` gate (the "Is the text crisp and sharp?" gate). Change its **yes** choice `goTo` from `done` to `g-chars`. Then add:

```mdx
  <WizardStep id="g-chars" title="Check the characters">
Look at the words and numbers on the test print.

    <WizardGate id="g-chars-gate" question="Are all the characters correct — no random symbols, boxes, or wrong letters?">
      <WizardChoice value="yes" label="Yes, the text is correct" goTo="g-drawer" />
      <WizardChoice value="no" label="No, it's garbled / has boxes / wrong characters" goTo="garbled-which" />
    </WizardGate>
  </WizardStep>

  <WizardQuestion id="garbled-which" title="What does the garbled text look like?">
    <WizardChoice value="symbols" label="Random letters/symbols on a normal (Latin) receipt" goTo="garbled-language" />
    <WizardChoice value="boxes" label="Boxes or missing letters in a non-Latin script (Arabic, Chinese, Thai, etc.)" goTo="garbled-raster" />
    <WizardChoice value="after-first" label="First receipt is fine, then later ones turn to gibberish" goTo="garbled-buffer" />
  </WizardQuestion>

  <WizardFix id="garbled-language" title="Wrong command language">
The printer is being sent the wrong command language. In **POS &gt; Settings &gt; Printing &gt; Advanced Settings**, change the **Language** to match your printer and try again: **ESC/POS** for Epson, and **StarPRNT** or **Star Line Mode** for Star (try both Star options). A mismatch makes the printer interpret the commands as random characters.

    <WizardGate id="g-garbled-lang" question="Correct now?">
      <WizardChoice value="yes" label="Yes" goTo="g-drawer" />
      <WizardChoice value="no" label="Still garbled" goTo="support" />
    </WizardGate>
  </WizardFix>

  <WizardFix id="garbled-raster" title="Non-Latin script — print as an image">
Thermal printers have a limited built-in font, so scripts they don't include (Arabic, Hebrew, many CJK and Thai characters) come out as boxes. Turn on **Full receipt raster** in **Advanced Settings** — it renders the whole receipt as an image, so any language prints exactly as it looks on screen. It's a little slower, so only use it when you need it.

    <WizardGate id="g-garbled-raster" question="Does the script print correctly now?">
      <WizardChoice value="yes" label="Yes" goTo="g-drawer" />
      <WizardChoice value="no" label="Still wrong" goTo="support" />
    </WizardGate>
  </WizardFix>

  <WizardFix id="garbled-buffer" title="Gibberish after the first receipt">
When the first receipt is perfect but later ones are garbled until you power-cycle the printer, the printer is usually being driven in an image/graphics mode its memory can't keep up with — common on inexpensive generic printers. Switch the printer profile to plain **text (ESC/POS)** mode rather than full-image printing, and turn **Full receipt raster** off if it's on. If you print a logo, storing it in the printer instead of sending it every receipt also helps.

    <WizardGate id="g-garbled-buffer" question="Do later receipts print correctly now?">
      <WizardChoice value="yes" label="Yes" goTo="g-drawer" />
      <WizardChoice value="no" label="Still turns to gibberish" goTo="support" />
    </WizardGate>
  </WizardFix>
```

---

## Task 2: Cash-drawer branch

**Files:** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

- [ ] **Step 1: Add the `g-drawer` gate (in the convergence, before `done`) and the drawer fix.**

`g-chars` success now routes to `g-drawer` (set in Task 1). Add:

```mdx
  <WizardStep id="g-drawer" title="Cash drawer">
If you have a cash drawer plugged into the printer, turn on **Auto-open cash drawer** in the printer's options and run a test sale to check it kicks open.

    <WizardGate id="g-drawer-gate" question="Do you have a cash drawer, and does it open?">
      <WizardChoice value="works" label="It opens / I don't use a drawer" goTo="done" />
      <WizardChoice value="no" label="It's connected but won't open" goTo="drawer-fix" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="drawer-fix" title="Cash drawer won't open">
Work through these — the drawer kicks off the printer, so it needs a thermal printer profile (the system print dialog can't open a drawer):

The drawer cable must be in the printer's **DK / cash-drawer port** — not a phone or network jack that looks the same. Make sure **Auto-open cash drawer** is enabled. On **Epson** printers, an enabled **buzzer** disables the drawer entirely — turn the buzzer off. The drawer also won't fire while the printer has an error (out of paper, cover open) — clear those first. Finally, the drawer's voltage (12V vs 24V) must match the printer; a mismatch won't fire it.

    <WizardGate id="g-drawer-retry" question="Does the drawer open now?">
      <WizardChoice value="yes" label="Yes" goTo="done" />
      <WizardChoice value="no" label="Still won't open" goTo="support" />
    </WizardGate>
  </WizardFix>
```

---

## Task 3: Deeper network troubleshooting

**Files:** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

- [ ] **Step 1: Route the network "still not printing" retry into a deeper-checks node.**

Find `fix-not-printing`'s retry gate (`g-retry-1`). Change its **no** choice `goTo` from `support` to `net-deep`. Then add (content from KB FM-9/10/11/18/19 + idle-sleep):

```mdx
  <WizardFix id="net-deep" title="Deeper network checks">
If the basics are right and it still won't print, one of these network issues is usually the cause:

**Wrong IP, or it changed.** Confirm the IP on the printer's self-test matches what you entered — it's easy to use another printer's address. Printers on DHCP can change address on reboot; set a **DHCP reservation** on your router so it stays put. An address starting `169.254` means the printer never got onto the network at all.

**It worked, then the first print of the day fails.** The printer's network card went to sleep; the first job wakes it and is lost. Send a second test, and consider a wired **Ethernet** connection for a fixed till.

**Two tills, one printer.** Many Star network printers accept only one connection at a time by default — a second register times out. Enable **9100 multi-session** in the printer's web configuration.

**Connects but never prints (Epson/Star network).** The printer's **ePOS-Print / WebPRNT** web service may be switched off, or the model has no built-in web server (only Epson's "intelligent" / -NT models and Star WebPRNT models do). Enable the service in the printer's web config, or use the **desktop app**.

**Wi-Fi won't join, or keeps dropping.** Receipt printers are usually **2.4GHz only** — put them on a 2.4GHz network, not a 5GHz-only or band-steered one. For an unstable connection, wired Ethernet is the reliable fix.

    <WizardGate id="g-net-deep" question="Printing now?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="Still not printing" goTo="support" />
    </WizardChoice>
    </WizardGate>
  </WizardFix>
```

> Use self-closing `<WizardChoice/>`; the stray `</WizardChoice>` above is illustrative — match the existing gates.

---

## Task 4: Validate, commit, PR

- [ ] **Step 1: Graph integrity** — goTo-vs-id cross-check: every `goTo` resolves; new ids present (`g-chars`, `g-chars-gate`, `garbled-which`, `garbled-language`, `garbled-raster`, `garbled-buffer`, `g-drawer`, `g-drawer-gate`, `drawer-fix`, `net-deep`, plus the new gate ids). Confirm `g-crisp`'s yes now points to `g-chars`, `g-chars` success → `g-drawer` → `done`, and `fix-not-printing`'s "still not printing" → `net-deep`.
- [ ] **Step 2: i18n** — `grep -nE 'caption='` empty; no single-quoted translatable props; multi-word brand labels (Star Line Mode, etc.) — `Star Line Mode` is multi-word and used in `garbled-language`; **confirm it's in `UNTRANSLATED_PROP_ALLOWLIST`** (it appears only in prose `children` here, not a prop — verify; prose is fine). `node scripts/check-translation-completeness.js --changed` passes.
- [ ] **Step 3: Build + tests** — `corepack pnpm build` (12 locales, onBrokenLinks) SUCCEEDS; `corepack pnpm test` → 166 pass.
- [ ] **Step 4: Commit + PR**
```bash
git add versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx
git commit -m "feat(printer-wizard): garbled-text, cash-drawer, and deeper-network troubleshooting"
git push -u origin feat/printer-wizard-fm-catalogue
gh pr create --base main --title "feat: printer wizard — garbled/cash-drawer/network FM depth" \
  --body "Adds the highest-value missing failure modes: a wrong-characters/garbled diagnostic (wrong command language / non-Latin->raster / per-job buffer), a cash-drawer branch (DK port, buzzer-disables-drawer, voltage, requires thermal profile), and deeper network troubleshooting (wrong/changed IP+DHCP, idle-sleep first-print, single-session 9100, ePOS/WebPRNT disabled or non-intelligent model, 2.4GHz Wi-Fi). New quality gates g-chars + g-drawer in the success convergence so all connection paths benefit. No engine changes. Full 12-locale build green; 166 tests pass."
```

---

## Self-review notes
- **Coverage:** garbled (KB FM-3/15/16/17 + raster) → Task 1; cash drawer (FM-7 + gotchas) → Task 2; network depth (FM-9/10/11/18/19 + wrong-ip/idle-sleep) → Task 3.
- **No engine changes** — 166 tests unchanged; pure additive MDX + two reroutes (`g-crisp` yes→`g-chars`; `g-retry-1` no→`net-deep`).
- **Convergence preserved** — all quality gates chain to `done`; all exhausted fixes → `support`; new gates sit on the shared convergence so web/BT/USB/network paths all reach them.
- **Graph never dangling** — author all nodes before committing; cross-check before build.
- **i18n** — `Star Line Mode` etc. appear in prose `children` (translated as prose), not as `label=`/`title=` props, so no allowlist entry needed; verify during Task 2.
