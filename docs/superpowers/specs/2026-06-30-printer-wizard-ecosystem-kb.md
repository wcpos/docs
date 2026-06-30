# Printer Setup Wizard — Ecosystem Knowledge Base

- **Date:** 2026-06-30
- **Companion to:** [printer-setup-wizard design spec](./2026-06-30-printer-setup-wizard-design.md)
- **Source:** synthesis of 98 findings from a 7-angle web sweep (community forums, developer Q&A, Epson, Star, generic/cheap thermal, browser-API limits, competitor POS docs) + a completeness critique.

> This is the research backbone for the wizard's troubleshooting content. The design spec's FM catalogue (§7.4) and pre-emption priorities (§7.7) draw from this. Confidence and source-quality caveats are recorded so authoring can lead with high-confidence guidance and verify the rest against primary vendor manuals + WCPOS's own support history before shipping.

---

## 1. Confirmed — reinforces existing FMs

### FM-1 (printer not detected)
- **User words:** "can't find the printer", "scan finds nothing", "printer not detected" (despite same Wi-Fi), "the pairing window is empty", "USB Printing Support / Unknown device".
- **Added workarounds:** AP/client isolation on guest+mesh SSIDs silently blocks client-to-client traffic (the #1 reason "same Wi-Fi" discovery fails — avoid guest networks); mDNS/Bonjour (UDP 5353) is link-local and won't cross subnets/VLANs/bands; iOS 14+ **Local Network permission** must be ON; WebUSB chooser cancel = `NotFoundError` (handle as "cancelled," not "no printer"); **manual IP entry is the reliable fallback** — treat auto-discovery as best-effort.
- **PROACTIVE:** offer "Enter IP manually" co-equal to "Scan"; warn about guest/isolated networks.

### FM-2 (detected, nothing prints)
- **User words:** "says sent but nothing comes out", "printer light flashing/red", "jammed and won't print after reload."
- **Added:** Epson ePOS returns **ASB status flags** (cover-open, paper-end, autocutter-err, unrecoverable) — surface the actual flag with a specific instruction instead of generic "sent." Some errors need a power-cycle.

### FM-3 (garbled / wrong charset; non-Latin → raster) — most-reinforced (~12 findings)
- **Root cause:** ESC/POS is single-byte code-page, never Unicode — `ESC t n` selects the table; bytes >127 mismap if app encoding ≠ active table.
- **User words:** "matrix of random letters", "endless question marks/boxes", "€/£ is a box", "started printing gibberish after a Windows update", "English text prints as Chinese."
- **Added workarounds:** transcode to the printer's code page (CP437/CP850/CP858 €£, CP1252 Western, CP852 Central EU, CP866 Cyrillic) + emit matching `ESC t n` — don't send raw UTF-8; **non-Latin/RTL → render as raster bitmap** (ESC/POS has no bidi/RTL/Arabic shaping; even CP864 prints reversed+unjoined); Star emulation mismatch prints literal "Illegal command" mid-receipt; some units boot in Kanji mode → send `FS .` (0x1C 0x2E) to cancel; verify font availability (GBK/GB18030/Big5).
- **PROACTIVE:** for non-Latin/RTL store locales, default to raster + a per-language "Render as image" toggle.

### FM-4 (misaligned columns / wrong width)
- **User words:** "columns/prices don't line up", "text runs off the right edge / cut off", "set 58mm but still wraps wrong."
- **Added:** 58mm=32 cpl, 80mm=42 (Font A)/48 (Font B/wide); **printable area < paper width** (80mm prints ~72mm, 58mm ~48mm) + hard margins → symmetric margins clip the right edge (use asymmetric); Star Document Markup auto word-wraps to width (preferable to hand-counting).
- **PROACTIVE:** auto-derive cpl from chosen width; offer a column-alignment test print.

### FM-5 (web can't reach raw-TCP printers)
- **User words:** "put in IP + port 9100 but web app can't reach it", "raw network printing works in desktop but not browser", "why do I need QZ Tray / a print client?"
- **Root cause:** browsers have **no raw-TCP socket API**; fetch/XHR = HTTP only; WebSocket ≠ raw socket; Direct Sockets API only for Isolated Web Apps.
- **Added:** in the Web tier, **do not offer raw-TCP/9100 for Generic printers**; require a vendor HTTP endpoint (Epson 8008/8043, Star 80/443) or cloud or a local bridge (QZ Tray localhost:8181/8182). Steer raw-TCP Generic to Desktop/native.
- **PROACTIVE:** gate by platform before the user enters an IP.

### FM-6 (mixed content: HTTP printer + HTTPS POS)
- **User words:** "Mixed Content … request has been blocked", "says it sent but nothing prints and no error", "works on http but not our secure site."
- **Root cause:** fetch/XHR is blockable, not auto-upgraded — killed before any byte leaves the browser (the "sent successfully" lie).
- **Added:** switch printer to HTTPS port (Epson 8043 / Star 443) then handle cert; **localhost/loopback is exempt** from mixed-content (a localhost bridge sidesteps it); `upgrade-insecure-requests` only helps if the printer actually serves HTTPS; modern Chrome/Edge now also block HTTPS→localhost helper connections (LNA) + show "Cannot Verify Trust" unless requests are signed.

### FM-7 (cash drawer won't kick)
- **User words:** "drawer won't open but receipts print", "opens manually with a key", "kick command does nothing", "pin 2 or pin 5?"
- **Added gotchas:** Epson **external buzzer disables the drawer entirely** (disable buzzer); kick-pin `ESC p 0` (pin 2) vs `ESC p 1` (pin 5) — try both; 24V vs 12V voltage mismatch fails or burns the solenoid; won't fire in error/out-of-paper state; cable must be in the **DK port** (not phone/LAN/pole-display RJ); Star opposite failure (pops on every power-on) = memory switch 7 bit 1 OFF.
- **PROACTIVE:** "Test Drawer" button at setup.

### FM-8 (Bluetooth pairing fails — mobile)
- **User words:** "won't pair", "paired yesterday won't connect now", "keeps disconnecting", "doesn't show in the list."
- **Added:** BT receipt printers are **single-host** (forget on the other device first; reset printer BT); iOS 14+ needs **both Bluetooth AND Local Network** permissions; **MFi/iAP** required for Star+iOS, some models (MCP31CB) don't support iOS BT at all (model-gate); Android battery optimization kills the link (set Unrestricted); Web Bluetooth: await every `writeValue()`, chunk to MTU, correct `requestDevice` filters.
- **PROACTIVE:** model-gate iOS BT; prompt OS permissions before pairing.

### FM-dialog (blurry = HTML/system print path)
- **User words:** "letters are blur and unreadable" (real WCPOS merchant), "prints like a photo of a receipt", "can't get rid of the browser print dialog", "drawer doesn't open and won't auto-cut."
- **Confirmed:** HTML/`window.print()` rasterizes via GDI — soft text, no cutter/drawer, "fit to page" clips. Also triggered by **IPP/AirPrint/WSD class queues** instead of the vendor raw queue. Star TSP100 futurePRNT needs "Enable ESC/POS Routing".

### FM-web-silent (says success, nothing prints)
- **Confirmed:** transport fails but code doesn't await/inspect; **ePOS `onreceive` success = the SEND result, not a print confirmation.** Cloud printing is inherently silent-fail + delayed (5–10s poll) — verify reachability + check the device status code; only report "printed" on a positive ack.

### FM-web-https-cert (self-signed cert untrusted)
- **User words:** "NET::ERR_CERT_AUTHORITY_INVALID", "I have to open the printer IP in the browser first every day", "connects on one laptop but not the new tablet."
- **Confirmed:** regenerate the printer's self-signed cert with **CN = the exact static IP** in the print URL (Epson WebConfig login `epson` / password = serial); **import cert into each device's OS/browser trust store** (in-browser "proceed" is session-scoped → "breaks every morning"); pin to static IP so CN keeps matching.

### FM-generic-usb-win (Windows Generic USB LIBUSB_ERROR_NOT_SUPPORTED)
- **Confirmed:** Windows binds `usbprint.sys`/vendor class driver exclusively; WebUSB/libusb can't claim it (same printer works on macOS/Android/ChromeOS).
- **Added:** Zadig→WinUSB frees it but **breaks the normal Windows print queue** (warn); alternatives — vendor virtual COM + Web Serial (Star virtual serial reported incompatible — test per model); install driver BEFORE plugging USB (Star); disable USB Power Save (Epson TM-L90).

### FM-usb-app-version (USB works in Chrome but not native app)
- **Reframed:** the real axis is **platform capability**, not app version. WebUSB is Chromium-only (Chrome 61+/Edge 79+/Android Chrome), never Firefox/Safari/iOS; same code works on Mac/Android, fails on Windows (driver-claim). Feature-detect and route.

### FM-crash-on-save (network test ok, app crashes/not saved)
- **Adjacent patterns:** kitchen/remote printer drops then dumps queued tickets on reconnect; destructive-action class — factory reset while pending offline payments/jobs exist permanently loses them (mirror Square's pre-reset caution).

### FM-wrong-ip (wrong/changed IP) — most-reinforced network FM (~8 findings)
- **The single most recurring network failure across the ecosystem.**
- **User words:** "it was working yesterday, now nothing prints", "the IP changed", "wrong receipts going to the kitchen printer."
- **Confirmed:** **DHCP reservation on the router is the preferred fix** (no printer-side config; static IP must be outside the DHCP pool); read current IP via self-test; `169.254.x.x` = APIPA (never got on the network); Loyverse's **first-three-octets** same-subnet check.
- **PROACTIVE:** push DHCP-reservation guidance at network setup (highest-frequency repeat-failure).

---

## 2. NEW problems (proposed FM-9 … FM-25)

| FM | Problem | Category | Lead workaround | Conf. |
|----|---------|----------|-----------------|-------|
| **FM-9** | Wrong network port/protocol (LPR/WSD/IPP instead of raw 9100) → silent fail | network-ip-port | Set printer+OS queue to RAW/9100 ("Standard TCP/IP → RAW") | high |
| **FM-10** | 2.4GHz-only printer can't join 5GHz / band-steered SSID | discovery/network | Dedicated 2.4GHz SSID; disable band-steering during onboarding | high · PROACTIVE |
| **FM-11** | Wi-Fi instability mid-shift (drops, weak signal, roaming) | network | **Hardwire Ethernet** for fixed POS; dedicated 2.4GHz; move closer | high |
| **FM-12** | Thermal paper loaded upside-down → blank (fixes ~50% of "blank" tickets) | media | **Scratch test** (mark = coated side, faces head); reload | high · PROACTIVE |
| **FM-13** | Faint / light printing | media/hardware | Raise density + lower speed; clean head w/ 90%+ IPA; spec paper | high |
| **FM-14** | Auto-cutter fails / cuts in wrong place | cutter-paper | Feed 2–5mm before cut; Full Cut + "cut after job"; clear chip jam | high |
| **FM-15** | Per-job gibberish *after the first receipt* (graphics/raster buffer overrun) — distinct from FM-3 | charset (buffer, not encoding) | Switch graphics→native ESC/POS text; logo to NVRAM; `ESC @` per job | high |
| **FM-16** | Deterministic power-up/first-job garbage (serial baud/flow-control mismatch) | serial/escpos | Match baud + flow control; `ESC @`; plug direct (no hub) | medium |
| **FM-17** | Clone doesn't truly implement ESC/POS (proprietary/partial dialect) | compatibility | Send true binary bytes + `ESC @`; per-model quirks profile; **steer to known-good models**; raster fallback | medium |
| **FM-18** | Star single-session 9100 lock — 2nd till can't connect (also ePOS `DEVICE_IN_USE`) | network | Enable **#9100 Multi Session** in web config (→8 sessions) | high |
| **FM-19** | ePOS/WebPRNT service disabled, or non-Intelligent/-NT model has no web server | service-config | Enable ePOS-Print in WebConfig+reset; **branch on model+firmware** | high · PROACTIVE |
| **FM-20** | Cloud-print misconfig (wrong/region URL, no poll time, not saved+rebooted, firewall, Epson **URL Encode left Enabled**, wrong media type) | cloud-printing | Verbatim device-group URL + region; poll 5–10s; Epson URL Encode=Disable; confirm egress | high |
| **FM-21** | Chrome **Local Network Access** permission prompt (Chrome 142+, Sept 2025) — deny/dismiss = silent fail | browser-policy | Coach user to click **Allow**; annotate `targetAddressSpace:'local'`; fall back to native | high · PROACTIVE |
| **FM-22** | Secure-context requirement — `navigator.usb/.bluetooth` undefined on plain http:// | secure-context | Always serve Web POS over HTTPS (build invariant); localhost exempt | high |
| **FM-23** | WordPress/Woo plugin conflict throws a PHP fatal in the print/admin path | host/app | Bisect plugins; read PHP error log; keep versions compatible | medium (WCPOS-specific) |
| **FM-24** | WebConfig admin lockout (forgotten/inherited password) | config-access | Default `epson`/serial; factory-reset (hold recessed reset at power-on) | medium |
| **FM-25** | Wrong printer class for kitchen (thermal blackens/fades from heat/steam/grease) | hardware-selection | **Impact/dot-matrix (Star SP700/SP742) + bond paper** for hot stations | medium · PROACTIVE |

(Per-FM user phrasing, ranked workarounds, sources, and branch placement are in the raw findings; the table is the actionable digest.)

---

## 3. Cross-product framing wins (Square / Loyverse / Lightspeed / Shopify / Toast / Clover)

1. **Supported-printer list + per-model branches.** Curated matrices kill driver/protocol/firmware variability. → Maintain an explicit supported list; ask exact model (or read self-test) **before** choosing a connection strategy; give Generic a separate "advanced/unsupported" lane.
2. **Static-IP / DHCP-reservation guidance baked into network setup** — make reservation the default, not an afterthought.
3. **"First three octets must match"** (Loyverse) — a one-line same-subnet self-check.
4. **Self-test page as the universal diagnostic** ("hold FEED at power-on") — current IP, emulation, firmware, interface.
5. **Platform × connection-method capability matrix as the branching backbone** — detect platform + browser engine first; only present methods that can work; explain *why* an impossible method is hidden.
6. **Explicit OS-permission gates** at the right step (iOS Local Network + Bluetooth; Android battery-unrestricted).
7. **Set expectations on cloud latency** (5–10s poll, normal); verify reachability vs fire-and-forget.
8. **Destructive-action guardrails** — warn before factory reset / clearing when pending offline jobs exist.
9. **Placement question** ("where will this print?") to route thermal-vs-impact (kitchen vs counter).

---

## 4. Pre-emption priorities (surface EARLY — frequency × how-stuck-users-get)

1. **Platform/engine gate FIRST** — the branching backbone; heads off the whole "works on Android not iPad" class (FM-5, FM-21, FM-22, FM-usb-app-version).
2. **DHCP reservation / static-IP guidance** at network setup — the single most recurring repeat-failure (FM-wrong-ip + FM-11).
3. **Model + firmware identification** (self-test or pick-list) — gates ePOS/WebPRNT/SDP, emulation, cpl, iOS-BT, single-session 9100 (FM-19, FM-3-Star, FM-18).
4. **Paper width → cpl auto-set + alignment test print** (FM-4).
5. **Locale-aware raster default** for non-Latin/RTL (FM-3).
6. **Network-quality nudges** — same SSID/subnet (not guest), 2.4GHz for the printer, prefer Ethernet (FM-1, FM-10, FM-11); manual-IP beside Scan.
7. **HTTPS-cert pre-trust step** for web + Epson/Star HTTPS (FM-web-https-cert) — pre-empts "breaks every morning."
8. **Chrome LNA "click Allow" coaching** on Web (FM-21) — brand-new failure.
9. **"Test print" + "Test drawer" as mandatory setup steps**, surfacing real ePOS/ASB status (FM-2, FM-7, FM-12, FM-web-silent).
10. **Paper-load / scratch-test tip** at first test print (FM-12).
11. **Placement question (counter vs kitchen)** → thermal-vs-impact (FM-25).
12. **OS-permission prompts at the right step** (iOS Local Network + Bluetooth, Android battery) for FM-1/FM-8.

---

## 5. Source-quality caveats (verify before shipping)

- **cpl numbers vary by font/DPI** — validate against actual target models with a live alignment print, don't hard-code.
- **Cash-drawer kick codes/pins are model-specific** — expose pin + duration as settings with a Test button; the buzzer-disables-drawer (Epson) and power-on-pop (Star mem switch 7 bit 1) gotchas are vendor-specific.
- **Star Web Serial incompatibility** is single-sourced and model-dependent — test before relying on it as the Windows fallback.
- **Clone `GS V` cutter variants and proprietary BLE framing** (FM-14, FM-17) are per-device — "maintain a quirks profile," not a universal rule.
- **CloudPRNT media-type matrix** (`vnd.star.*` by model) varies — verify per model.
- **Chrome LNA (FM-21) timing/behavior** (Chrome 142, Sept 2025) and `targetAddressSpace` are shifting — verify at ship time; WebSocket/WebTransport/WebRTC reportedly not yet LNA-gated (confirm — affects bridge workarounds).
- **CJK `FS .` cancel-Kanji and firmware-font availability** are firmware-dependent — keep as "try this," not "always."
- **WordPress plugin-conflict (FM-23)** is single-source but matches WCPOS's host env — verify against your own support log.
- **WebUSB "~76%" support** and version floors drift — feature-detect, don't version-sniff or publish the number.
- **Confidence:** network-IP, mixed-content, charset/code-page, secure-context, browser-API gating, BT single-host, paper-load, DHCP findings are **high** and multiply-corroborated. Cash-drawer specifics, clone dialects, cutter variants, CloudPRNT media types, serial baud are **medium** — need per-model validation.

---

## 6. Completeness critique — remaining gaps

**Power / hardware basics (largely absent):** not-powered, **PSU brick failure** (common on TM/TSP), wrong/underpowered adapter, **error-LED blink-code interpretation** (a "what is your printer's light doing?" branch). Paper-jam clear + cutter-blade reset as its own pre-emptive step.

**Printer sleep / idle timeout dropping the link:** the high-frequency "**first print of the day fails, second works**" / "fails after sitting idle" — NIC/BT sleeps, first job wakes it and is lost. Distinct from FM-wrong-ip. *(Strong candidate for a new FM.)*

**Firewall / antivirus / endpoint-security blocking:** Windows Defender / third-party AV blocking outbound 9100 or the local-bridge port; corporate endpoint security killing the helper. Desktop/Electron raw-TCP blocked by host firewall is unlisted.

**VLAN / guest-WiFi isolation / double-NAT / captive portal:** double-NAT (travel/second router), captive portals (tablet/printer stuck on accept page), VLAN segmentation named explicitly (POS vs staff VLAN; mDNS reflector/Avahi repeater workaround).

**Generic multi-cashier contention on 9100:** generalize beyond Star (FM-18) — Generic/Epson raw-9100 also serialize/refuse concurrent sessions; client-side queue/retry-with-backoff mitigation. WCPOS is multi-register by design.

**Label vs receipt confusion:** users try label printers (Zebra ZPL/EPL, Brother QL, DYMO) as receipt printers — different command language entirely. A gate: "this wizard is for receipt printers, not label printers."

**Certificate specifics:** self-signed **cert expiry** (re-breaks), HSTS interactions, and **mobile cert install** (iOS requires a separate "trust" toggle in Settings after install — notorious gotcha) — materially different from desktop.

**Per-shipped-locale encoding table:** FM-3 is strong on mechanism but lacks a locale→code-page/raster map. WCPOS ships 12 locales — Thai (TIS-620/CP874), Vietnamese (combining diacritics → raster), Greek (CP737/869), Hebrew/Arabic (RTL → raster), Cyrillic. Enumerate which shipped locales need raster.

**Highest-value next source:** **WCPOS's own GitHub issues / forum / support log** was not mined — it would validate the WCPOS-specific findings (FM-23, the blurry-print merchant) and surface 2–3 more real FMs in users' actual words. Recommended targeted follow-ups: (1) `wcpos printer site:github.com OR site:wordpress.org`; (2) `receipt printer "first print fails" / "first job of the day" idle/sleep`; (3) `(Zebra|ZPL|DYMO|label printer) "won't print receipt" ESC/POS`.
