# RED 安全打印供应商调查（收据/POS 打印机） {#red-secure-printing-vendor-sweep-receiptpos-printers}

日期：2026-08-26
状态：研究结论——针对一手资料的网络调查（Epson 官方 PDF/FAQ、供应商合规页面、POS 供应商帮助中心）。无法直接访问 Epson `download4.epson.biz` PDF（非浏览器抓取工具会收到 403），但已通过只读代理获取完整文本，以下引用均为一手内容。

既有背景（本次调查前已验证，按原文引用）：(EU) 2022/30 针对可连接互联网的无线电设备启用 RED 2014/53/EU 第 3(3)(d)(e)(f) 条；(EU) 2023/2444 将适用日期推迟至 2025-08-01。Epson TM-m30III 固件 13.21 在 RED 设备上默认启用“安全打印”：明文 RAW-9100 和 HTTP ePOS 作业会被静默保留约 4 分钟（导致设备阻塞），随后丢弃，而状态仍显示正常；启用时 ePOS-Print 在 443 端口响应，禁用时在 443+80 端口响应；8008 已关闭；8043 为 ePOS-Device (socket.io)；解决方法为 WebConfig → Print → Secure Printing → Disable（管理员密码默认为设备序列号）。Shopify 文档指出：“已启用 RED 的打印机目前无法使用……请关闭安全打印”。

## 执行摘要 {#executive-summary}

- Epson 是唯一有文档记录表明其安全默认设置会**阻止打印**的收据打印机供应商（“安全打印”）；该功能在所有 RED 范围内的设备上默认启用，涉及 13 个 TM 机型系列（列表见下文，内容直接来自 Epson 的 eRED 指南 Rev. D）。
- 启用安全打印后：端口 9100（RAW）、端口 80（HTTP ePOS）和 ePOS SDK 端口 8008/8009 **无法打印**；TLS 路径 9143、443、8043、8143 可进行加密打印。无论该开关状态如何，RED 固件都会直接禁用 LPR 和 TLS 1.0/1.1。
- 可通过打印网络状态页识别 RED 设备：`Security Mode: RED`（同时会打印 `Initial Password:`）。`Normal`/`PSTI`/`Internal`/无内容 = 未启用 RED。管理员密码因设备而异——视型号不同，为序列号或标签上的密码。
- 官方支持禁用安全打印（TM Utility、Web Config、EpsonNet Config），但 Epson 警告此操作“并不推荐”；Epson 的欧盟 FAQ 表示，**固件更新会将 RED 合规配置重置为标准状态**——禁用后的设备会在更新后再次出现故障（转述措辞，来自 Epson FAQ 搜索结果）。
- Star Micronics：**未发现相关内容**——没有 RED 声明，也没有默认安全模式；当前 TSP100IV 规格（Rev 2.20）仍默认启用 TCP#9100，并使用 web/telnet `root`/`public` 默认凭据。没有 POS 供应商记录 Star 的 RED 故障。
- Bixolon（一手资料，EMEA 合规页面）：在 2025-08-01 当日或之后购买的 EMEA 设备，必须在初始设置时创建“受保护模式”密码，之后才能更改配置；没有证据表明打印功能本身会被阻止。
- Citizen、SII、Munbyn、HPRT、Rongta：未发现相关内容——没有记录任何 RED 特定的行为变更。
- 对于 Epson 而言，仅使用有线以太网并不自动意味着不在适用范围内：其指南指出，通过以太网使用的符合 RED 标准的设备仍需要 RED 兼容软件；只有仅通过 USB/串行/并行方式运行的设备可豁免。此外，Epson 通过阻止出站互联网连接（NTP、证书自动更新），将部分旧款以太网产品排除在 RED 范围之外——这是第一手获取的 "Non_RED" 说明页。
- 非欧盟设备：所有 Epson/Bixolon/Lightspeed 文档均将变更范围限定为*投放至欧盟/英国/EFTA（或 EMEA）市场的设备*；状态表中的 `Security Mode` 字段（RED、PSTI 或 Normal）表明可能使用同一固件，并按市场设置安全模式，因此美国/澳大利亚库存应显示 `Normal`/无内容——此为推断，尚未获得直接确认。
- 记录该故障的 POS 供应商：Shopify（Epson TM-m30II/TM-m30III/T88 故障排除页面）和 Lightspeed K-Series（通过 Back Office 中的“启用安全打印”开关支持经认可的安全路径）。未找到 Square、Loyverse、Toast、SumUp、Zettle、Epos Now 的相关内容。

## Epson {#epson}

**变更内容**（第一手资料，[网络安全增强补充指南，eRED_POS Rev. D，M00167303](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revD.pdf)——直接访问返回 403；已通过代理获取全文）：

- 每台设备均有唯一的出厂默认密码，印在标签上（状态表上也显示为“初始密码”）。[Web Config Reference Guide RevG](https://download4.epson.biz/sec_pubs/bs/pdf/TM-m30III_m50II_P20II_P80II_WebConfig_rg_en_RevG.pdf)（通过代理获取）根据型号采用两种表述：“初始密码位于产品所附标签上”和“初始密码为产品的序列号”。同一密码用于保护 Web Config、面板锁定和 EpsonNet Config。
- 在线通信需要身份验证和加密；固件更新及敏感设置需要管理员密码；新增审计日志（默认启用；Web Config → Product Security → Audit Log）。
- RED 设备上的 SNMPv3 默认身份验证算法为 SHA2-256。

**适用 RED 的型号**（第一手资料，eRED Rev. D 表格——带 CE 标志市场的设备）：TM-H6000VI（全部）、TM-L100（除串行/USB 型号外全部）、TM-m30II-S、TM-m30II-SL、TM-m30III、TM-m30III-H、TM-m50、TM-m50II、TM-P20II、TM-P80II、TM-P80II 自动切刀、TM-T20IV（除串行/USB 型号外全部）、TM-T88VII（全部）。适用接口：以太网、无线 LAN（除非内置，否则使用 OT-WL06 加密狗）、蓝牙。

**默认状态**：“所有适用 RED 范围的产品均默认启用安全打印设置。”（eRED Rev. D，第一手资料。）

**端口矩阵**（第一手资料，eRED Rev. D）：

| 路径 | 已启用安全打印（默认） | 已禁用 |
|---|---|---|
| 端口 9100 (RAW) | 无法打印 | 可以打印 |
| 端口 9143 (TLS RAW) | 可以打印（加密） | 可以打印（加密） |
| 端口 80 (HTTP ePOS) | 无法打印 | 可以打印 |
| 端口 443 (HTTPS ePOS) | 可以打印（加密） | 可以打印（加密） |
| 端口 8008 / 8009 (ePOS SDK) | 无法打印 | 可以打印 |
| 端口 8043 / 8143 (ePOS SDK TLS) | 可以打印（加密） | 可以打印（加密） |
| 经典 Bluetooth | 可以打印（加密） | 可以打印 |

此外，在 RED 固件上（与此开关无关）：LPR 端口打印已禁用（原为已启用），TLS 1.0/1.1 已禁用，SSL/TLS 加密强度为高（原为中）。

**症状特征**：仅 eRED Rev. D 说明，添加到旧系统的 RED 设备“如果按原样连接，将无法正常打印”，并且加密“可能影响性能”。具体的“状态显示正常，但任务被保持约 4 分钟后丢弃”的行为来自既有背景信息（fw 13.21、TM-m30III），未在任何公开文档中找到。

**认可的安全路径**（一手资料，eRED Rev. D）：使用与 RED 兼容的软件——驱动程序/SDK 需达到列出的最低版本（APD 6 ≥ 6.10、JavaPOS ADK ≥ 1.14.38、OPOS ≥ 3.00E R27、ePOS SDK Android/iOS ≥ 2.33.0、ePOS SDK JavaScript ≥ **2.27.0f**、TM Utility ≥ 3.38.0、EpsonNet Config ≥ 4.9.11、TM Virtual Port Driver ≥ 8.70d、Mac 驱动程序 ≥ 3.0.1）；或者使用 TM Virtual Port Driver 将 Ethernet/BT 映射到虚拟串口，该工具“会自动加密 ESC/POS 数据，无需修改应用程序”。否则，原始 ESC/POS 应用程序只能通过 USB/Serial/Parallel 运行。RED 兼容的 OS 列表不包括 Linux、Win 7/8/POSReady；macOS 需要 TM-m30III fw ≥ 13.17。不支持 RED 设备的软件（仅在禁用 Secure Printing 时可用）包括：Mac 驱动程序（低于 3.0.1）、Linux CUPS 驱动程序、TM Bluetooth Connector、Send Data Tool 等。

**解决方法 / 禁用**：可通过“TM Utility、Web Config 或 EpsonNet Config（Web 版本）”切换该设置（eRED Rev. D；[Shopify 的 TM-m30II 故障排除](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting)也列出了相同的三个工具）。所有设置更改都会要求输入管理员密码（eRED Rev. D）。**没有已记录的方法可在不知道管理员密码的情况下禁用 Secure Printing**——未找到可通过 USB/Bluetooth 上的 TM Utility 在未知密码时完成此操作的方法。对于仅支持 Bluetooth 的 TM-P20II/P80II，需通过 Epson Deployment Tool 更改设置（eRED Rev. D）。Epson 的 EU FAQ（[KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us)，一手抓取结果 + 搜索记录）指出：旧系统需要手动重新启用端口 9100 和 LPR，并称“固件更新会将 RED 合规配置重置为标准配置，因为这是 RED Directive 规定的法律要求”（二手表述——来自同一 FAQ 系列的搜索记录；抓取的页面直接确认了关于 9100/LPR 的表述）。

**识别方法**（一手资料，eRED Rev. D）：打印网络状态页（打开盖子时按住进纸按钮 ≥1 秒，或按住状态页按钮 ≥3 秒）。`Security Mode: RED` = 已启用 RED；`Normal` / `PSTI` / `Internal` / 未显示 = 未启用。Lightspeed 还指出：“无法通过外观识别硬件是否符合 RED 标准……包装盒内附有额外的信息页”（[设置打印机](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)）。

**固件版本**：未找到将安全打印与特定型号版本关联的公开逐型号固件版本列表（epson 下载主机上的发行说明 PDF 返回 403）。已知：TM-m30III fw 13.21 包含此功能（既有背景）；macOS RED 支持需要 TM-m30III fw ≥ 13.17（eRED Rev. D）。

## Star Micronics {#star-micronics}

**未找到任何内容。**未找到提及无线电设备指令、EN 18031 或默认安全的打印阻止模式的 RED 声明、安全公告或固件发行说明——已搜索 starmicronics.com 帮助中心、star-m.jp 在线手册、Star Micronics Cloud 公告及 POS 供应商帮助中心。

缺失证据（均为一手资料）：
- 当前 [TSP100IV 通用规格手册 Rev 2.20](https://www.starasia.com/Download/Manual/tsp100iv_spc_en.pdf)：TCP#9100 默认**启用**；Web 配置 `root`/`public`、telnet `root`/`public` 以及 `user`/`guest` 为出厂默认值；不含 RED/EN 18031/安全模式相关内容。根据该规格，原始 StarPRNT LAN 打印默认仍处于开放状态。
- [TSP100IV 在线手册——高级设置（LAN）](https://star-m.jp/products/s_print/oml/tsp100iv/manual/en/settings/DNSsettings.htm)：TCP#9100/9101、UDP#22222 和 LPR 默认均为已启用；需要 fw ≥ 1.1 才能禁用它们（Telnet 默认值也在 fw 1.1 时改为已禁用）。
- 从同一手册系列的搜索结果中获取（二手资料）：使用默认密码登录 Web 配置时，必须先进入密码修改界面，才能更改设置——这似乎是 Star 与 EN 18031 相邻的强化措施，但并不会阻止打印。
- [Shopify 的 mC-Print3 故障排除](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/mC-Print3/troubleshooting)不含 **RED**/安全相关条目（一手获取），而 [Lightspeed 的 RED 说明](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)明确仅适用于 Epson（“已在所有其他打印机型号上禁用”）。

注意：Rev 2.20 规格可能早于 2025-08 之后的欧盟硬件修订；缺少文档并不证明 Star 的欧盟库存未发生变化。但截至本次排查，尚无 Star 原始打印故障的现场报告或供应商文档。结论：Star 不存在默认安全的原始打印阻止机制——中等置信度，基于缺失证据。

## Bixolon {#bixolon}

来自 [BIXOLON 合规性（bixoloneu.com）](https://bixoloneu.com/bixolon-compliance/) 的一手资料：

- “如果打印机于 2025 年 8 月 1 日或之后在欧洲、中东或非洲（EMEA）购买，则将包含增强型安全功能，以符合欧盟无线电设备指令（RED）。”
- 在打印机初始设置期间，系统会要求创建受保护模式密码，并启用受保护模式后才能更改某些配置选项。
- 详细信息请参阅“BIXOLON Wi-Fi 连接手册”；EN 18031 符合性通过 bixolon.com 上的 EN18031 DoC 记录。

默认状态：初始设置时强制配置受保护模式（配置限制）。**未发现默认阻止打印（原始 9100 等）的证据**——已记录的变更限制的是配置，而非打印路径。预期症状特征：在创建受保护模式密码前，设置向导/实用工具会失败。解决方法：按照 Wi-Fi 连接手册完成受保护模式设置。型号列表：合规性页面未公布。

## Citizen Systems {#citizen-systems}

**未发现任何内容。** [Citizen 的产品安全页面](https://www.citizen-systems.co.jp/en/printer/support/product_security/)（第一手资料）没有 RED/EN 18031 内容、2025 年固件公告，并声明“我们的产品中尚未发现漏洞”。在 citizen-systems.com 上也未找到 CT-S/CT-E 型号的 RED 相关通知。

## Seiko Instruments（SII） {#seiko-instruments-sii}

**未发现任何内容。** RP-F10/RP-E10 文档仅提及 EMC/LVD/RoHS 指令；在 sii-ps.com / sii-thermalprinters.com 上未找到 RED 网络安全通知、安全模式或 2025 年固件变更。

## Munbyn、HPRT、Rongta {#munbyn-hprt-rongta}

**未发现任何内容。** 三者均未提供 RED/EN 18031 符合性声明或安全默认设置文档。（这些经济型品牌针对 2022/30 的欧盟合规情况未公开记录；其面向欧盟市场的设备可能根本未经过相关测试。）

## POS 厂商指南页面 {#pos-vendor-guidance-pages}

- **Shopify**——至少三个 Epson 故障排除页面包含 RED 条目：[TM-m30II](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting)、[TM-m30III](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30iii/troubleshooting)（既定背景）和 [T88 系列](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsont88-series/troubleshooting)。措辞（第一手抓取）：“已启用 RED（无线电设备指令）的打印机目前无法使用”；“所有属于 RED 适用范围的产品均默认启用安全打印”；解决方法＝通过 TM Utility、Web Config 或 EpsonNet Config 禁用安全打印。Shopify 的立场：将其关闭（不支持安全路径）。未找到 Star/Bixolon 的 RED 页面。
- **Lightspeed Restaurant K-Series**——唯一发现支持*经认可*路径的厂商：[设置打印机](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)文档说明，后台有一个“启用安全打印”开关，“对于欧盟和英国的 Epson 打印机必须启用……而对于所有其他打印机型号均禁用”，并警告“打印会略有延迟”，同时告知用户查找包装盒内的信息单以识别 RED 设备。[TM-L100 设置页面](https://k-series-support.lightspeedhq.com/hc/en-us/articles/31036519879707-Epson-TM-L100-thermal-printer-setup)也重复了这一说明（“（仅限欧盟/英国）勾选启用安全打印”），其故障排除流程还包括：如果测试票据失败，则禁用该选项（搜索结果捕获，二手资料）。仅覆盖 Epson。
- **Square、Loyverse、Toast、SumUp、Zettle、Epos Now** ——未发现任何相关内容。截至本次排查，未找到提及 RED 或安全打印的帮助中心页面。
- 补充：[HP 支持页面提供了一份适用于其 Engage POS 产品线的“Epson printers - EU RED requirement”文档](https://support.hp.com/in-en/document/ish_13029629-13029677-16)（两次获取均超时；内容未经验证——仅确认存在二手引用）。

## 适用范围边界 {#scope-boundaries}

- **仅使用 USB／串行／并行接口运行不在适用范围内**：“在开发仅通过 USB 接口、串行接口或并行接口连接运行的商用系统时，系统开发无需符合 RED 要求。”（eRED Rev. D，一手资料。）
- **RED 设备上的有线以太网不享有豁免**：“RED 是针对无线设备的法规。即使实际仅使用以太网接口连接，系统开发也必须符合 RED 要求。”（eRED Rev. D，一手资料。）也就是说，通过以太网使用的 TM-m30III 仍会强制启用安全打印——设备带有无线电模块，因此整个产品都会受 RED 约束。不要告诉用户“使用以太网，因此 RED 不适用”。
- **Epson 的不适用范围修改说明**（一手资料，[Non_RED_sht_en_RevA.pdf “经修改后不属于 RED 法规适用范围的产品”，M00169200](https://download4.epson.biz/sec_pubs/bs/pdf/Non_RED_sht_en_RevA.pdf)，通过代理获取）：Epson 限制了旧款产品的*出站互联网访问*（NTP 仅限本地网络；忽略自动 CA 证书更新），使其不触发 2022/30 中“连接互联网”的条件，从而保持在 RED 法规适用范围之外：TM-m30II（内置以太网／OT-WL06）、TM-L90（UB-E04）、TM-U220IIB（UB-E04）、TM-T20III（内置以太网）、TM-S2000II-NW、UB-E04 板卡、UB-R05 Wi-Fi 板卡（UB-R05 不再受 RED TM-T88VII 支持）。这些设备会在状态页打印 `Security Mode: Normal`、`PSTI` 或 `Internal`，并按传统方式运行（不启用安全打印）。
- **非欧盟市场设备**：所有厂商声明均按投放市场而非型号界定此次变更：Epson 指“于 2025 年 8 月 1 日后投放欧盟、英国和 EFTA 市场”（[EU FAQ KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us)）；eRED 指“面向要求 CE 标志的国家”；Bixolon 指“于 2025 年 8 月 1 日或之后在 EMEA 购买”；Lightspeed 指“进口至欧盟和英国”。状态页中不同的 `Security Mode` 值（RED／PSTI／Normal／Internal）表明固件统一，并按市场设置安全模式，而非在所有地区启用 RED（PSTI = 英国的产品安全制度）。推断：美国／澳大利亚市场库存出厂时安全打印关闭（`Normal` 或为空）；在其他地区购买的灰色市场设备／欧盟来源设备将启用 RED。未找到美国／澳大利亚的直接确认——请标记为推断。

## 对 WCPOS 文档／打印机向导的影响 {#implications-for-wcpos-docs--printer-wizard}

应包含以下故障模式条目：

1. **Epson RED 设备，原始 9100 或 HTTP ePOS 路径**：打印任务会消失（先被保留，随后丢弃），而打印机报告状态正常；连接测试可能通过。检测方法：RED 列表中的型号 + 欧盟／英国市场 + 端口探测（443 响应 ePOS，但 80／8008 不响应 → 很可能已启用安全打印；80 响应 → 已关闭）。解决页面：打印状态页 → 确认 `Security Mode: RED` → WebConfig → Print → Secure Printing → Disable（管理员密码 = 序列号或包装盒／设备标签）——另需警告：**固件更新会重新启用该功能**，因此更新后必须重新应用此修复（或改用 TLS 路径集成）。
2. **首选长期方案**：WCPOS 应在 RED 设备上通过 HTTPS ePOS（443）／ePOS-Device（8043）打印，使安全打印保持启用状态——这符合 Epson 认可的路径及 Lightspeed 的做法；可避免固件更新后反复回归的问题。向导应根据端口探测结果分支，而不是要求所有用户禁用该功能。
3. **Epson 有线以太网注意事项文档**：“仅使用以太网并不能获得豁免”——设备的无线电模块使其处于适用范围内；只有仅支持 USB／串行接口的型号（以及经过 Non_RED 修改的旧型号列表）享有豁免。
4. **向导识别步骤**：提示打印网络状态页（打开机盖时按住进纸按钮 ≥1 秒／按住状态按钮 ≥3 秒）；读取 `Security Mode:` 和 `Initial Password:`。这是唯一可靠的 RED 检测方式——包装标签并不可靠（Lightspeed）。
5. **Bixolon EMEA 条目**：初始设置要求先创建 Protected Mode 密码，才能更改配置；面向 Bixolon EMEA 设备的向导文案应预先说明这一步强制设置密码的流程。未发现打印路径受阻的相关说明——此条目应仅限于配置范围。
6. **Star 条目**：RED 没有变化——请勿添加 Star RED 故障模式；无法使用原始 9100 端口的 Star 设备另有原因（固件 < 1.1 时甚至无法切换端口；默认端口为开放）。如果 Star 在此次调查后推出欧盟硬件修订版本，请重新评估。
7. **非欧盟用户**：文档应说明 RED 行为取决于设备的*销售*地区（欧盟／英国／EFTA／EMEA），因此澳大利亚／美国商家通常不会遇到此问题——进口设备或灰色市场设备除外。
8. 在文档中保留受影响的 Epson 型号列表（上述 13 个系列），以便支持团队通过型号、市场和状态页一步完成分流。

## 来源索引 {#source-index}

第一手资料：[eRED_POS Rev. D](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revD.pdf)（通过代理获取；Rev. B/C URL 同样有效：[revB](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revB.pdf)、[revC](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revC.pdf)）· [Non_RED_sht_en_RevA](https://download4.epson.biz/sec_pubs/bs/pdf/Non_RED_sht_en_RevA.pdf)（通过代理获取）· [Epson WebConfig RG RevG](https://download4.epson.biz/sec_pubs/bs/pdf/TM-m30III_m50II_P20II_P80II_WebConfig_rg_en_RevG.pdf)（通过代理获取）· [Epson 欧盟常见问题 KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us) · [Bixolon 合规性](https://bixoloneu.com/bixolon-compliance/) · [Shopify TM-m30II](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting)／[T88](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsont88-series/troubleshooting)／[mC-Print3](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/mC-Print3/troubleshooting) · [Lightspeed 打印机设置](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)／[TM-L100](https://k-series-support.lightspeedhq.com/hc/en-us/articles/31036519879707-Epson-TM-L100-thermal-printer-setup) · [Star TSP100IV 规格 Rev 2.20](https://www.starasia.com/Download/Manual/tsp100iv_spc_en.pdf) · [Star TSP100IV LAN 设置手册](https://star-m.jp/products/s_print/oml/tsp100iv/manual/en/settings/DNSsettings.htm) · [Citizen 产品安全](https://www.citizen-systems.co.jp/en/printer/support/product_security/)。
二手／未经验证：固件更新会重置 RED 的表述（Epson 常见问题搜索记录）· Star 首次登录时强制更改密码（star-m.jp 手册搜索记录）· [HP“Epson 打印机 - 欧盟 RED 要求”](https://support.hp.com/in-en/document/ish_13029629-13029677-16)（获取超时）· Lightspeed 测试失败时禁用的流程（搜索记录）。
