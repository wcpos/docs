# Printer Setup Wizard — Hard Branches (web-cert / Bluetooth / USB)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Replace the `bt-usb-not-covered` stub and the web-network caveat with real guided paths for the three highest-support-pain cases: **web + network + HTTPS/cert** (the "Toshi" week-long case), **Bluetooth** pairing, and **USB** (incl. the Windows libusb gotcha). All additive MDX content on the existing engine — **no engine changes**.

**Architecture decision (content-only, no router primitive):** the engine routes by static `goTo` (no `showWhen` evaluation). To branch correctly by platform, the `platform` question routes to **platform-specific connection questions** rather than one shared `connection` node. This costs a little duplication (3 connection variants) but keeps the engine simple and the graph explicit. (A conditional-routing primitive was considered and deferred — revisit only if the FM-catalogue expansion makes duplication painful.)

**Branch:** `feat/printer-wizard-hard-branches`, from `main` (both prior phases merged). PR → `main`.

**Content sources (read these):** `versioned_docs/version-1.x/hardware/printers.mdx` (web ePOS/WebPRNT, ports, BT/USB, mixed content), the design spec `docs/superpowers/specs/2026-06-30-printer-setup-wizard-design.md` §6.5/§7.1–7.4, and the ecosystem KB `docs/superpowers/specs/2026-06-30-printer-wizard-ecosystem-kb.md` (FM-8 Bluetooth, FM-generic-usb-win, FM-web-https-cert/FM-web-silent, FM-21/22 browser limits). The "Toshi" evidence is summarized in spec §3a.

---

## Setup (execution-time)

```bash
git -C /Users/kilbot/Projects/docs worktree add -b feat/printer-wizard-hard-branches ../docs-pw-hard main
cd ../docs-pw-hard && corepack pnpm install
```

The full wizard (engine + local + cloud) is on `main`. Read `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx` (the current tree) and `src/components/PrinterWizard/nodes.js` (prop contracts).

---

## Target graph (new + reused nodes)

**Reroute** the existing `platform` question's choices:
- `web → conn-web`, `desktop → conn-full`, `android → conn-full`, `ios → conn-ios`

**New connection questions:**
- `conn-full` (desktop/android): network → `vendor` (reuse → `network-setup`); bluetooth → `bt-setup`; usb → `usb-setup`
- `conn-ios`: network → `vendor`; bluetooth → `bt-setup` (no USB on iOS)
- `conn-web`: network → `web-vendor`; bluetooth → `web-btusb`; usb → `web-btusb`

**New web-network path (the Toshi model — authored in full in Task 2):** `web-vendor` → `web-net-setup` → gate → `web-net-fix` → reuse `g-width`.
**New Bluetooth path:** `bt-setup` → gate → `bt-fix` → reuse `g-width`.
**New USB path:** `usb-setup` → gate → `usb-fix` → reuse `g-width`.
**New invalid:** `web-generic-invalid` (Generic on web network → use desktop).

**Reused (unchanged):** `where`, `platform`, `vendor`, `network-setup`, `g-testprint`, `fix-not-printing`, `g-width`, `fix-width`, `g-crisp`, `fix-crisp`, `done`, `support`, and the whole cloud branch.
**Removed:** `bt-usb-not-covered` (replaced by real paths) — and the `:::note Using the web app?` admonition in `network-setup` (web users now have their own path, no longer routed through `network-setup`).

All success test-prints converge on `g-width` → `g-crisp` → `done`; exhausted troubleshooting → `support`.

---

## Task 1: Reroute platform + add the connection questions

**Files:** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

- [ ] **Step 1: Reroute the `platform` choices**

Change the existing `platform` `<WizardQuestion>` choices' `goTo`:
```mdx
  <WizardQuestion id="platform" title="Which app are you using WCPOS in?">
    <WizardChoice value="web" label="Web browser" goTo="conn-web" />
    <WizardChoice value="desktop" label="Desktop app (Windows or Mac)" goTo="conn-full" />
    <WizardChoice value="ios" label="iPhone or iPad" goTo="conn-ios" />
    <WizardChoice value="android" label="Android" goTo="conn-full" />
  </WizardQuestion>
```

- [ ] **Step 2: Add the three connection questions** (place after the `platform` question)
```mdx
  <WizardQuestion id="conn-full" title="How does the printer connect?">
    <WizardChoice value="network" label="Network / Wi-Fi (it has an IP address)" goTo="vendor" />
    <WizardChoice value="bluetooth" label="Bluetooth" goTo="bt-setup" />
    <WizardChoice value="usb" label="USB cable" goTo="usb-setup" />
  </WizardQuestion>

  <WizardQuestion id="conn-ios" title="How does the printer connect?">
    <WizardChoice value="network" label="Network / Wi-Fi (it has an IP address)" goTo="vendor" />
    <WizardChoice value="bluetooth" label="Bluetooth" goTo="bt-setup" />
  </WizardQuestion>

  <WizardQuestion id="conn-web" title="How does the printer connect?">
    <WizardChoice value="network" label="Network / Wi-Fi (it has an IP address)" goTo="web-vendor" />
    <WizardChoice value="bluetooth" label="Bluetooth" goTo="web-btusb" />
    <WizardChoice value="usb" label="USB cable" goTo="web-btusb" />
  </WizardQuestion>
```

- [ ] **Step 3: Remove the `bt-usb-not-covered` node** and the `:::note Using the web app?` admonition block inside `network-setup` (web users no longer reach `network-setup`). Leave the rest of `network-setup` intact.

- [ ] **Step 4:** (commit folded into Task 4 — graph dangles until the new targets exist)

---

## Task 2: The web-network-cert path (the Toshi model — author in full)

**Files:** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

- [ ] **Step 1: Add the web vendor question + cert path** (accurate to printers.mdx §Epson/§Star + spec §3a/§7.4)
```mdx
  <WizardQuestion id="web-vendor" title="What brand is the printer?">
    <WizardChoice value="star" label="Star" goTo="web-net-setup" />
    <WizardChoice value="epson" label="Epson" goTo="web-net-setup" />
    <WizardChoice value="generic" label="Generic / other ESC/POS" goTo="web-generic-invalid" />
  </WizardQuestion>

  <WizardInvalid id="web-generic-invalid" title="Generic printers need the desktop app">
A web browser can't open a raw network connection, so it can only reach **Epson** and **Star** printers that have a built-in print server. For a generic ESC/POS network printer, use the **desktop app**, which connects directly over the network (port 9100) — download it from the [Printer Setup](/hardware/printers) page.
  </WizardInvalid>

  <WizardStep id="web-net-setup" title="Connect a network printer from the web app">
Printing to a network printer **from a web browser** is the trickiest setup, because the browser can only talk to the printer's built-in web server over HTTP/HTTPS — and a secure (HTTPS) POS forces a secure connection to the printer too.

First, confirm the printer is reachable: open `http://<printer-ip>/` in a new browser tab. If you see the printer's own configuration page, it's on the network; if not, fix the network/IP first.

Then add the printer in **POS &gt; Settings &gt; Printing** with its IP address. If your POS runs over **HTTPS**, the connection to the printer is forced to HTTPS (Epson port 8043, Star 443) — which only works if the printer has a trusted **SSL certificate**.

    <WizardGate id="g-web-net" question="Did the test print succeed?">
      <WizardChoice value="yes" label="Yes, it printed" goTo="g-width" />
      <WizardChoice value="no" label="No, it errored or said sent but nothing printed" goTo="web-net-fix" />
    </WizardChoice>
    </WizardGate>
  </WizardStep>

  <WizardFix id="web-net-fix" title="When web network printing won't work">
This is the most common dead-end, and it usually isn't fixable from the browser. Here's why and what to do:

Print the printer's **self-test** and look at the SSL/TLS section. If it says the certificate does **not exist**, HTTPS printing can't work until you generate one — and the browser won't trust a self-signed certificate without you visiting `https://<printer-ip>` once and accepting it on every device.

A "sent successfully" message that prints nothing means the browser silently blocked the request (the printer speaks HTTP but your POS is HTTPS — a "mixed content" block), or the port was forced to 443 with no certificate.

**The reliable fix is the desktop app**, which connects straight to the printer over the network (port 9100) with none of the browser's HTTPS restrictions. Download it from [Printer Setup](/hardware/printers) and add the same printer there.

    <WizardGate id="g-web-net-retry" question="Did you get it working (on the web, or by switching to the desktop app)?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="Still not printing" goTo="support" />
    </WizardChoice>
    </WizardGate>
  </WizardFix>
```

> NOTE: the `<WizardChoice>` self-closing tags above must NOT be wrapped in an extra `</WizardChoice>` — author them as self-closing `<WizardChoice ... />` inside the `<WizardGate>`. (The sample shows the gate structure; match the existing gates in the file, which use self-closing choices.)

- [ ] **Step 2:** (commit folded into Task 4)

---

## Task 3: Bluetooth and USB paths

**Files:** `versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx`

Author from KB FM-8 (Bluetooth) and FM-generic-usb-win + printers.mdx (USB). Match the existing node/gate shape (self-closing `<WizardChoice>`).

- [ ] **Step 1: Bluetooth path**
```mdx
  <WizardStep id="bt-setup" title="Connect over Bluetooth">
Bluetooth receipt printing on mobile uses the printer maker's own software, so the printer must be an **Epson** or **Star** model (generic Bluetooth printers aren't supported on phones/tablets).

First, **pair the printer in your device's system Bluetooth settings** — not in WCPOS. Bluetooth printers only remember one device at a time, so if it was paired to another till, "forget" it there first. On **iPhone/iPad**, also allow WCPOS both **Bluetooth** and **Local Network** permission when prompted. On **Android**, set WCPOS to **unrestricted** battery use so the system doesn't drop the connection.

Then in **POS &gt; Settings &gt; Printing**, tap **Scan for printers** and pick yours — its name and brand fill in automatically.

    <WizardGate id="g-bt" question="Did the test print succeed?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="No / it won't pair or connect" goTo="bt-fix" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="bt-fix" title="Bluetooth won't pair or keeps dropping">
Pair the printer in the device's **system Bluetooth settings first**, then scan again in WCPOS. If it paired before and won't reconnect, "forget" it on the other device (and reset the printer's Bluetooth) so it isn't still bound there. Make sure it's powered on and in range. On iPhone/iPad, confirm WCPOS has both Bluetooth and Local Network permission; on Android, set the app to unrestricted battery use. Remember Bluetooth supports **Epson and Star only** — a generic Bluetooth printer won't connect.

    <WizardGate id="g-bt-retry" question="Connected now?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="Still won't connect" goTo="support" />
    </WizardGate>
  </WizardFix>
```

- [ ] **Step 2: USB path**
```mdx
  <WizardStep id="usb-setup" title="Connect over USB">
Plug the printer in by USB. On **Android**, approve the USB permission prompt when it appears, then pick the printer in **POS &gt; Settings &gt; Printing**. On the **desktop app (Windows)**, a generic printer may need its driver installed **before** you plug it in.

    <WizardGate id="g-usb" question="Did the test print succeed?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="No / it errored" goTo="usb-fix" />
    </WizardGate>
  </WizardStep>

  <WizardFix id="usb-fix" title="USB won't connect">
On **Android**, re-plug the cable and approve the USB permission prompt. On the **desktop app (Windows)**, a `LIBUSB_ERROR_NOT_SUPPORTED` error means Windows has locked the device to its own print driver — the simplest fix is to **connect the printer over the network (port 9100) instead**, which avoids USB drivers entirely. (Advanced users can replace the driver with a WinUSB tool, but that disables the normal Windows print queue for the device — only do this if you know what you're doing.)

    <WizardGate id="g-usb-retry" question="Working now?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="Still not printing" goTo="support" />
    </WizardGate>
  </WizardFix>
```

- [ ] **Step 3: Web Bluetooth/USB note**
```mdx
  <WizardStep id="web-btusb" title="Bluetooth & USB from a web browser">
Connecting a printer to the **web app** over Bluetooth or USB works only in **Google Chrome or Microsoft Edge** (Safari and Firefox can't do it), and the printer must be an **Epson** or **Star** model. Click **Connect** in **POS &gt; Settings &gt; Printing** and choose the printer in the browser's device chooser.

If you're not on Chrome or Edge — or it won't connect — the **desktop app** is the most reliable option for Bluetooth and USB. Download it from [Printer Setup](/hardware/printers).

    <WizardGate id="g-web-btusb" question="Did the test print succeed?">
      <WizardChoice value="yes" label="Yes" goTo="g-width" />
      <WizardChoice value="no" label="No" goTo="support" />
    </WizardGate>
  </WizardStep>
```

---

## Task 4: Validate, commit, PR

**Files:** none (validation + ship)

- [ ] **Step 1: Graph integrity** — run the goTo-vs-id cross-check on the MDX. Every `goTo` resolves; `bt-usb-not-covered` is fully gone (no remaining references). New ids present: `conn-full`, `conn-ios`, `conn-web`, `web-vendor`, `web-generic-invalid`, `web-net-setup`, `web-net-fix`, `bt-setup`, `bt-fix`, `usb-setup`, `usb-fix`, `web-btusb`.

- [ ] **Step 2: i18n** — `grep -nE 'caption=' <file>` empty; no single-quoted translatable props; multi-word brand labels (none new expected — verify). `node scripts/check-translation-completeness.js --changed` passes.

- [ ] **Step 3: Build + tests** — `corepack pnpm build` (12 locales, onBrokenLinks) SUCCEEDS; `corepack pnpm test` → 166 pass (no engine changes).

- [ ] **Step 4: Commit + PR**
```bash
git add versioned_docs/version-1.x/hardware/printer-setup-wizard.mdx
git commit -m "feat(printer-wizard): real web-cert / Bluetooth / USB branches (replace stub)"
git push -u origin feat/printer-wizard-hard-branches
gh pr create --base main --title "feat: printer wizard — web-cert, Bluetooth & USB branches" \
  --body "Replaces the bt-usb-not-covered stub with real guided paths for the three highest-support-pain cases: web+network+HTTPS/cert (the Toshi case), Bluetooth pairing, and USB (incl. Windows libusb). Platform choices now route to platform-specific connection questions. No engine changes. Full 12-locale build green; 166 tests pass."
```

---

## Self-review notes
- **Coverage:** web-cert (§3a/§7.4 FM-web-silent/https-cert) → Task 2; Bluetooth (KB FM-8) → Task 3; USB incl. libusb (FM-generic-usb-win) → Task 3; Generic-on-web invalid (§6.5) → Task 2.
- **No engine changes** — 166 tests unchanged; pure additive MDX + platform rerouting.
- **Graph never committed dangling** — Tasks 1–3 land in one commit (Task 4).
- **Convergence** — every success path reaches `g-width` → `g-crisp` → `done`; every dead-end reaches `support`.
- **Honest validity** — iOS omits USB (`conn-ios` has no USB choice); web Generic network → invalid→desktop; mobile BT/USB = Epson/Star only (stated in prose).
