# RED Secure-Printing Vendor Sweep (Receipt/POS Printers)

Date: 2026-08-26
Status: research findings — web sweep against primary sources (Epson official PDFs/FAQs, vendor compliance pages, POS vendor help centers). Epson `download4.epson.biz` PDFs were unreachable directly (403 to non-browser fetchers) but full text was retrieved via a read-only proxy and is quoted first-hand below.

Established context (verified prior to this sweep, cited as given): (EU) 2022/30 activates RED 2014/53/EU Art. 3(3)(d)(e)(f) for internet-connectable radio equipment; (EU) 2023/2444 defers application to 2025-08-01. Epson TM-m30III fw 13.21 ships "Secure Printing" enabled on RED units: plaintext raw-9100 and HTTP ePOS jobs are silently held ~4 min (jamming the device) then discarded while status reads healthy; ePOS-Print answers on 443 when enabled, 443+80 when disabled; 8008 closed; 8043 is ePOS-Device (socket.io); remedy is WebConfig → Print → Secure Printing → Disable (admin password defaults to unit serial). Shopify documents "RED activated printers don't work currently... turn off Secure Printing".

## Executive summary

- Epson is the only receipt-printer vendor with a documented **print-blocking** secure default ("Secure Printing"), enabled by default on all RED-scope units; 13 TM model families are in scope (list below, first-hand from Epson's eRED guide Rev. D).
- With Secure Printing enabled: port 9100 (RAW), port 80 (HTTP ePOS), and ePOS SDK ports 8008/8009 **cannot print**; TLS paths 9143, 443, 8043, 8143 print encrypted. LPR, TLS 1.0/1.1 are disabled outright on RED firmware regardless of the toggle.
- RED units are identified by printing a network status sheet: `Security Mode: RED` (also prints `Initial Password:`). `Normal`/`PSTI`/`Internal`/nothing = not RED-activated. Admin password is unique per unit — serial number or a label, model-dependent.
- Disabling Secure Printing is officially supported (TM Utility, Web Config, EpsonNet Config) but Epson warns it's "not recommended", and Epson's EU FAQ states **firmware updates reset RED compliance configuration to standard** — a disabled unit re-breaks after update (secondhand wording, from Epson FAQ search capture).
- Star Micronics: **nothing found** — no RED statement, no secure-by-default mode; current TSP100IV spec (Rev 2.20) still ships TCP#9100 ENABLE and web/telnet `root`/`public` defaults. No POS vendor documents Star RED breakage.
- Bixolon (first-hand, EMEA compliance page): EMEA units purchased on/after 2025-08-01 force creation of a "Protected Mode" password at initial setup before config changes; no evidence printing itself is blocked.
- Citizen, SII, Munbyn, HPRT, Rongta: nothing found — no RED-specific behavior changes documented.
- Wired-Ethernet-only is **not** automatically out of scope for Epson: their guide says RED-compliant units used over Ethernet still require RED-compatible software; only USB/Serial/Parallel-only operation is exempt. Separately, Epson pulled some legacy Ethernet products out of RED scope by blocking outbound internet (NTP, cert auto-update) — the "Non_RED" leaflet, captured first-hand.
- Non-EU units: all Epson/Bixolon/Lightspeed language scopes the change to units *placed on EU/UK/EFTA (or EMEA) markets*; the status-sheet `Security Mode` field (RED vs PSTI vs Normal) implies one firmware with per-market security mode, so US/AU stock should print `Normal`/nothing — inference, not directly confirmed.
- POS vendors documenting the breakage: Shopify (Epson TM-m30II/TM-m30III/T88 troubleshooting pages) and Lightspeed K-Series (supports the sanctioned secure path via a Back Office "Enable secure printing" toggle). Square, Loyverse, Toast, SumUp, Zettle, Epos Now: nothing found.

## Epson

**What changed** (first-hand, [Cybersecurity Enhancement Supplementary Guide, eRED_POS Rev. D, M00167303](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revD.pdf) — 403 direct; full text retrieved via proxy):

- Unique factory default password per device, printed on a label ("Initial Password" also on the status sheet). The [Web Config Reference Guide RevG](https://download4.epson.biz/sec_pubs/bs/pdf/TM-m30III_m50II_P20II_P80II_WebConfig_rg_en_RevG.pdf) (retrieved via proxy) carries both wordings model-dependently: "The initial password is provided on the label attached to the product" and "The initial password is the product's serial number". Same password gates Web Config, panel lock, and EpsonNet Config.
- Authentication + encryption required for online communication; admin password required for firmware updates and sensitive settings; audit log added (default enabled; Web Config → Product Security → Audit Log).
- SNMPv3 default auth algorithm SHA2-256 on RED units.

**Models in scope of RED** (first-hand, eRED Rev. D table — CE-mark-market units): TM-H6000VI (all), TM-L100 (all except Serial/USB model), TM-m30II-S, TM-m30II-SL, TM-m30III, TM-m30III-H, TM-m50, TM-m50II, TM-P20II, TM-P80II, TM-P80II Auto Cutter, TM-T20IV (all except Serial/USB model), TM-T88VII (all). Interfaces in scope: Ethernet, Wireless LAN (OT-WL06 dongle unless built-in), Bluetooth.

**Default state**: "Secure Printing Setting is enabled by default on all products that are in scope of RED." (eRED Rev. D, first-hand.)

**Port matrix** (first-hand, eRED Rev. D):

| Path | Secure Printing ENABLED (default) | DISABLED |
|---|---|---|
| Port 9100 (RAW) | Cannot print | Can print |
| Port 9143 (TLS RAW) | Can print (encrypted) | Can print (encrypted) |
| Port 80 (HTTP ePOS) | Cannot print | Can print |
| Port 443 (HTTPS ePOS) | Can print (encrypted) | Can print (encrypted) |
| Port 8008 / 8009 (ePOS SDK) | Cannot print | Can print |
| Port 8043 / 8143 (ePOS SDK TLS) | Can print (encrypted) | Can print (encrypted) |
| Bluetooth Classic | Can print (encrypted) | Can print |

Additionally on RED firmware (independent of the toggle): LPR port printing Disabled (was Enabled), TLS 1.0/1.1 Disabled, SSL/TLS encryption strength High (was Medium).

**Symptom signature**: eRED Rev. D only says a RED unit added to a legacy system "will not print properly if connected as is" and that encryption "may impact performance". The specific held-~4-min-then-discarded-while-status-reads-healthy behavior is from established context (fw 13.21, TM-m30III), not found in any public doc.

**Sanctioned secure path** (first-hand, eRED Rev. D): use RED-compatible software — drivers/SDKs at listed minimum versions (APD 6 ≥ 6.10, JavaPOS ADK ≥ 1.14.38, OPOS ≥ 3.00E R27, ePOS SDK Android/iOS ≥ 2.33.0, ePOS SDK JavaScript ≥ **2.27.0f**, TM Utility ≥ 3.38.0, EpsonNet Config ≥ 4.9.11, TM Virtual Port Driver ≥ 8.70d, Mac driver ≥ 3.0.1); or map Ethernet/BT to a virtual serial port with TM Virtual Port Driver, which "will automatically encrypt the ESC/POS data without the need to modify the application". Raw ESC/POS apps otherwise only run over USB/Serial/Parallel. RED-compatible OS list excludes Linux, Win 7/8/POSReady; macOS needs TM-m30III fw ≥ 13.17. Software *not* supporting RED units (works only with Secure Printing disabled): Mac driver (pre-3.0.1), Linux CUPS driver, TM Bluetooth Connector, Send Data Tool, and others.

**Remedy / disable**: setting is togglable via "TM Utility, Web Config, or EpsonNet Config (Web version)" (eRED Rev. D; same three named by [Shopify's TM-m30II troubleshooting](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting)). All setting changes prompt for the admin password (eRED Rev. D). **No documented path to disable Secure Printing without the admin password** — TM Utility over USB/Bluetooth without knowing the password: nothing found. For Bluetooth-only TM-P20II/P80II, settings changes go through Epson Deployment Tool (eRED Rev. D). Epson's EU FAQ ([KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us), first-hand fetch + search capture): legacy systems need port 9100 and LPR manually re-enabled, and "the firmware update will have reset the RED compliance configuration to standard as it's a legal requirement defined by the RED Directive" (secondhand wording — from search capture of the same FAQ family; the fetched page confirmed the 9100/LPR sentence directly).

**Identification** (first-hand, eRED Rev. D): print a network status sheet (feed button ≥1 s with cover open, or status-sheet button ≥3 s). `Security Mode: RED` = RED-activated; `Normal` / `PSTI` / `Internal` / absent = not. Lightspeed adds: "no way to visually identify hardware as RED-compliant... extra info sheet inside the box" ([Setting up a printer](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)).

**Firmware versions**: no public per-model firmware version list found tying Secure Printing to specific versions (release-note PDFs on epson download hosts 403). Known: TM-m30III fw 13.21 carries it (established context); macOS RED support needs TM-m30III fw ≥ 13.17 (eRED Rev. D).

## Star Micronics

**Nothing found.** No RED statement, security notice, or firmware release note mentioning the Radio Equipment Directive, EN 18031, or a secure-by-default print-blocking mode — searched starmicronics.com help center, star-m.jp online manuals, Star Micronics Cloud notices, and POS-vendor help centers.

Evidence of absence (all first-hand):
- Current [TSP100IV general spec manual Rev 2.20](https://www.starasia.com/Download/Manual/tsp100iv_spc_en.pdf): TCP#9100 default **ENABLE**; web config `root`/`public` and telnet `root`/`public`, `user`/`guest` factory defaults; no RED/EN 18031/security-mode content. Raw StarPRNT LAN printing remains open by default per this spec.
- [TSP100IV online manual — Advanced Settings (LAN)](https://star-m.jp/products/s_print/oml/tsp100iv/manual/en/settings/DNSsettings.htm): TCP#9100/9101, UDP#22222, LPR all default Enabled; fw ≥ 1.1 required to be able to disable them (and Telnet default became Disabled at fw 1.1).
- Search-captured (secondhand) from the same manual family: logging into Web Configuration with the default password forces a password-change screen before settings can be changed — Star's apparent EN 18031-adjacent hardening, but it does not block printing.
- [Shopify's mC-Print3 troubleshooting](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/mC-Print3/troubleshooting) has **no** RED/security entry (first-hand fetch), and [Lightspeed's RED note](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer) is explicitly Epson-only ("disabled on all other printer models").

Caveat: the Rev 2.20 spec may predate post-2025-08 EU hardware revisions; absence of documentation is not proof Star's EU stock is unchanged. But as of this sweep there are zero field reports or vendor docs of Star raw-print breakage. Mark: no secure-by-default raw-print blocking on Star — moderately confident, evidence-of-absence.

## Bixolon

First-hand from [BIXOLON Compliance (bixoloneu.com)](https://bixoloneu.com/bixolon-compliance/):

- "If your printer was purchased in Europe, the Middle East, or Africa (EMEA) on or after August 1, 2025, it will include enhanced security features designed to comply with the EU Radio Equipment Directive (RED)."
- "During the printer's initial setup, you will be required to create a Protected Mode password and enable Protected Mode before certain configuration options can be changed."
- Details deferred to "BIXOLON's Wi-Fi Connection Manual"; EN 18031 conformity documented via an EN18031 DoC on bixolon.com.

Default state: Protected Mode setup is forced at initial setup (config-gating). **No evidence found that printing (raw 9100 etc.) is blocked by default** — the documented change gates configuration, not the print path. Symptom signature to expect: setup wizards/utilities failing until a Protected Mode password is created. Remedy: complete Protected Mode setup per the Wi-Fi Connection Manual. Model list: not published on the compliance page.

## Citizen Systems

**Nothing found.** [Citizen's product security page](https://www.citizen-systems.co.jp/en/printer/support/product_security/) (first-hand) has no RED/EN 18031 content, no 2025 firmware advisories, and states "no vulnerabilities have been found in our products". No RED-related notices located for CT-S/CT-E models on citizen-systems.com either.

## Seiko Instruments (SII)

**Nothing found.** RP-F10/RP-E10 documentation references EMC/LVD/RoHS directives only; no RED cybersecurity notice, security mode, or 2025 firmware change located on sii-ps.com / sii-thermalprinters.com.

## Munbyn, HPRT, Rongta

**Nothing found.** No RED/EN 18031 compliance statements or secure-default documentation for any of the three. (Budget-brand EU compliance posture for 2022/30 is undocumented publicly; their EU-market units may simply be untested against it.)

## POS vendor guidance pages

- **Shopify** — RED entry present on at least three Epson troubleshooting pages: [TM-m30II](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting), [TM-m30III](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30iii/troubleshooting) (established context), and [T88 series](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsont88-series/troubleshooting). Phrasing (first-hand fetch): "RED (Radio Equipment Directive) activated printers don't work currently"; "Secure Printing is activated by default on all products that are in scope of RED"; remedy = disable Secure Printing via TM Utility, Web Config, or EpsonNet Config. Shopify's posture: turn it off (no support for the secure path). No Star/Bixolon RED pages found.
- **Lightspeed Restaurant K-Series** — the only vendor found supporting the *sanctioned* path: [Setting up a printer](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer) documents a Back Office "Enable secure printing" toggle that "must be enabled... for Epson printers in the EU and UK, and is disabled on all other printer models", warns of "a slight delay in printing", and tells users to find the in-box info sheet to identify RED units. The [TM-L100 setup page](https://k-series-support.lightspeedhq.com/hc/en-us/articles/31036519879707-Epson-TM-L100-thermal-printer-setup) repeats it ("(EU/UK only) Check the box for Enable secure printing"), and their troubleshooting flow includes disabling it if test tickets fail (search capture, secondhand). Epson-only coverage.
- **Square, Loyverse, Toast, SumUp, Zettle, Epos Now** — nothing found. No help-center pages mentioning RED or Secure Printing as of this sweep.
- Secondary: [HP support carries an "Epson printers - EU RED requirement" document](https://support.hp.com/in-en/document/ish_13029629-13029677-16) for its Engage POS line (fetch timed out twice; content unverified — secondhand existence only).

## Scope boundaries

- **USB/Serial/Parallel-only operation is out of scope**: "When developing a business system that operates only with a USB Interface connection, a Serial Interface connection, or a Parallel Interface connection, system development is not required to be compatible with RED." (eRED Rev. D, first-hand.)
- **Wired Ethernet on a RED unit is NOT exempt**: "RED is a legal regulation for wireless devices. Even if only an Ethernet Interface connection is actively used, system development must be compatible with RED." (eRED Rev. D, first-hand.) I.e., a TM-m30III used over Ethernet still enforces Secure Printing — the unit carries radios, so the whole product is RED-activated. Do not tell users "you're on Ethernet, so RED doesn't apply".
- **Epson's out-of-scope modification sheet** (first-hand, [Non_RED_sht_en_RevA.pdf "Products modified to be out of scope of RED regulations", M00169200](https://download4.epson.biz/sec_pubs/bs/pdf/Non_RED_sht_en_RevA.pdf), retrieved via proxy): Epson restricted *outbound internet access* (NTP limited to local network; automatic CA-cert update ignored) on legacy products to keep them outside 2022/30's "internet-connected" trigger: TM-m30II (built-in Ethernet / OT-WL06), TM-L90 (UB-E04), TM-U220IIB (UB-E04), TM-T20III (built-in Ethernet), TM-S2000II-NW, UB-E04 board, UB-R05 Wi-Fi board (UB-R05 no longer supported by RED TM-T88VII). These print `Security Mode: Normal`, `PSTI`, or `Internal` on the status sheet and behave conventionally (no Secure Printing).
- **Non-EU market units**: every vendor statement scopes the change to market placement, not model: Epson "placed on the EU, UK and EFTA markets after 1st August 2025" ([EU FAQ KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us)); eRED "bound for countries requiring the CE mark"; Bixolon "purchased in EMEA on or after August 1, 2025"; Lightspeed "imported into the EU and UK". The status sheet's distinct `Security Mode` values (RED / PSTI / Normal / Internal) indicate unified firmware with a per-market security mode rather than RED-on everywhere (PSTI = the UK's product-security regime). Inference: US/AU-market stock ships with Secure Printing off (`Normal` or blank); grey-market/EU-sourced units bought elsewhere WILL be RED-activated. No direct US/AU confirmation found — mark inferred.

## Implications for WCPOS docs / printer wizard

Failure-mode entries that should exist:

1. **Epson RED unit, raw 9100 or HTTP ePOS path**: jobs vanish (held then discarded) while the printer reports healthy; connection tests can pass. Detection: model in the RED list + EU/UK market + port probe (443 answers ePOS but 80/8008 don't → Secure Printing likely ON; 80 answering → OFF). Remedy page: print status sheet → confirm `Security Mode: RED` → WebConfig → Print → Secure Printing → Disable (admin password = serial or box/unit label) — plus the warning that **firmware updates re-enable it**, so the fix must be re-applied after updates (or the integration moved to the TLS path).
2. **Preferred long-term path**: WCPOS should print via HTTPS ePOS (443) / ePOS-Device (8043) on RED units so Secure Printing can stay enabled — matches Epson's sanctioned path and Lightspeed's approach; avoids the firmware-update regression loop. Wizard should branch on the port probe rather than telling everyone to disable.
3. **Epson wired-Ethernet caveat doc**: "Ethernet-only doesn't exempt you" — the unit's radios put it in scope; only USB/Serial-only models (and the Non_RED-modified legacy list) are exempt.
4. **Identification step for the wizard**: instruct printing the network status sheet (feed-button-with-cover-open ≥1 s / status button ≥3 s); read `Security Mode:` and `Initial Password:`. This is the only reliable RED detector — box labeling is not (Lightspeed).
5. **Bixolon EMEA entry**: initial setup requires creating a Protected Mode password before config changes; wizard copy for Bixolon EMEA units should anticipate the forced password step. No print-path blockage documented — keep this entry config-scoped.
6. **Star entry**: no RED changes — do NOT add a Star RED failure mode; a Star unit failing raw 9100 has a different cause (fw < 1.1 can't even toggle ports; defaults are open). Revisit if Star ships EU hardware revisions post-sweep.
7. **Non-EU users**: doc should say RED behavior follows where the unit was *sold* (EU/UK/EFTA/EMEA), so AU/US merchants normally won't see it — except on imported/grey-market units.
8. Keep the Epson affected-model list (13 families above) in the docs so support can triage by model + market + status sheet in one step.

## Source index

First-hand: [eRED_POS Rev. D](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revD.pdf) (proxy-retrieved; Rev. B/C URLs also live: [revB](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revB.pdf), [revC](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revC.pdf)) · [Non_RED_sht_en_RevA](https://download4.epson.biz/sec_pubs/bs/pdf/Non_RED_sht_en_RevA.pdf) (proxy-retrieved) · [Epson WebConfig RG RevG](https://download4.epson.biz/sec_pubs/bs/pdf/TM-m30III_m50II_P20II_P80II_WebConfig_rg_en_RevG.pdf) (proxy-retrieved) · [Epson EU FAQ KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us) · [Bixolon Compliance](https://bixoloneu.com/bixolon-compliance/) · [Shopify TM-m30II](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting) / [T88](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsont88-series/troubleshooting) / [mC-Print3](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/mC-Print3/troubleshooting) · [Lightspeed printer setup](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer) / [TM-L100](https://k-series-support.lightspeedhq.com/hc/en-us/articles/31036519879707-Epson-TM-L100-thermal-printer-setup) · [Star TSP100IV spec Rev 2.20](https://www.starasia.com/Download/Manual/tsp100iv_spc_en.pdf) · [Star TSP100IV LAN settings manual](https://star-m.jp/products/s_print/oml/tsp100iv/manual/en/settings/DNSsettings.htm) · [Citizen product security](https://www.citizen-systems.co.jp/en/printer/support/product_security/).
Secondhand/unverified: firmware-update-resets-RED wording (Epson FAQ search capture) · Star forced-password-change-on-first-login (star-m.jp manual search capture) · [HP "Epson printers - EU RED requirement"](https://support.hp.com/in-en/document/ish_13029629-13029677-16) (fetch timed out) · Lightspeed disable-if-test-fails flow (search capture).
