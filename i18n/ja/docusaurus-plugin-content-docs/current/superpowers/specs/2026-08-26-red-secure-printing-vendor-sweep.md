# RED セキュア印刷ベンダー調査（レシート/POS プリンター） {#red-secure-printing-vendor-sweep-receiptpos-printers}

日付: 2026-08-26
ステータス: 調査結果 — 一次情報（Epson 公式 PDF/FAQ、ベンダーのコンプライアンスページ、POS ベンダーのヘルプセンター）を対象としたウェブ調査。Epson の `download4.epson.biz` PDF には直接アクセスできなかった（ブラウザー以外のフェッチでは 403）が、読み取り専用プロキシ経由で全文を取得し、以下に一次情報として引用している。

確立済みの背景（本調査前に検証済み、記載どおりに引用）: (EU) 2022/30 は、インターネット接続可能な無線機器に対して RED 2014/53/EU 第 3 条(3)(d)(e)(f)を有効化する。(EU) 2023/2444 は適用を 2025-08-01 まで延期する。Epson TM-m30III fw 13.21 は、RED 対象ユニットで「セキュア印刷」を有効にして出荷される。平文の raw-9100 および HTTP ePOS ジョブは通知なく約 4 分間保留され（デバイスを詰まらせ）、その後破棄される一方で、ステータスは正常と表示される。有効時は ePOS-Print が 443 で応答し、無効時は 443+80 で応答する。8008 は閉じられ、8043 は ePOS-Device（socket.io）である。対処方法は WebConfig → 印刷 → セキュア印刷 → 無効（管理者パスワードの既定値はユニットのシリアル番号）。Shopify は「RED が有効なプリンターは現在動作しないため、セキュア印刷を無効にする」と案内している。

## エグゼクティブサマリー {#executive-summary}

- Epson は、RED 対象のすべてのユニットで既定で有効になっている、文書化済みの**印刷をブロックする**セキュアな既定設定（「セキュア印刷」）を持つ唯一のレシートプリンターベンダーである。対象は TM の 13 モデルファミリー（下記リスト、Epson の eRED ガイド Rev. D による一次情報）。
- セキュア印刷が有効な場合: ポート 9100（RAW）、ポート 80（HTTP ePOS）、および ePOS SDK ポート 8008/8009 では**印刷できない**。TLS 経路の 9143、443、8043、8143 では暗号化して印刷される。RED ファームウェアでは、切り替え設定にかかわらず LPR と TLS 1.0/1.1 は完全に無効化される。
- RED ユニットは、ネットワークステータスシートを印刷して識別できる: `Security Mode: RED`（`Initial Password:` も印刷される）。`Normal`/`PSTI`/`Internal`/何もなし = RED は有効化されていない。管理者パスワードはユニットごとに固有であり、モデルに応じてシリアル番号またはラベルが使用される。
- セキュア印刷の無効化は公式にサポートされている（TM Utility、Web Config、EpsonNet Config）が、Epson は「推奨しない」と警告している。また Epson の EU FAQ では、**ファームウェア更新により RED コンプライアンス設定が標準にリセットされる**と説明されている。そのため、無効化したユニットは更新後に再び問題が発生する（Epson FAQ の検索結果キャプチャーによる二次情報の表現）。
- Star Micronics: **該当情報なし** — RED に関する記述や既定で有効なセキュアモードは見つからなかった。現行の TSP100IV 仕様（Rev 2.20）では、引き続き TCP#9100 ENABLE と、web/telnet の `root`/`public` 既定値で出荷されている。Star の RED による障害を文書化した POS ベンダーはない。
- Bixolon（一次情報、EMEA コンプライアンスページ）: 2025-08-01 以降に購入した EMEA ユニットでは、設定変更の前に初期設定時に「保護モード」パスワードの作成が強制される。印刷自体がブロックされる証拠はない。
- Citizen、SII、Munbyn、HPRT、Rongta: 該当情報なし — RED 固有の動作変更は文書化されていない。
- 有線 Ethernet 専用であっても、Epson では自動的に対象外になるわけではありません。Epson のガイドでは、Ethernet 経由で使用する RED 準拠機器には RED 対応ソフトウェアが引き続き必要であり、USB/Serial/Parallel 専用の運用のみが免除されるとされています。これとは別に、Epson は一部の旧式 Ethernet 製品について、外部インターネット通信（NTP、証明書の自動更新）を遮断することで RED の適用対象から外しました。これは一次資料の "Non_RED" リーフレットに記載されています。
- EU 域外の機器: Epson/Bixolon/Lightspeed のいずれも、この変更の対象を *EU/英国/EFTA（または EMEA）市場に投入される機器* に限定しています。ステータスシートの `Security Mode` フィールド（RED、PSTI、Normal）は、市場ごとにセキュリティモードを切り替える単一のファームウェアを示唆しているため、米国/オーストラリア向け在庫では `Normal` または空欄で印字されるはずです。これは推論であり、直接の確認は取れていません。
- 不具合を文書化している POS ベンダー: Shopify（Epson TM-m30II/TM-m30III/T88 のトラブルシューティングページ）および Lightspeed K-Series（バックオフィスの「セキュア印刷を有効にする」トグルにより、承認済みのセキュアな経路をサポート）。Square、Loyverse、Toast、SumUp、Zettle、Epos Now では該当情報は見つかりませんでした。

## Epson {#epson}

**変更内容**（一次資料、[Cybersecurity Enhancement Supplementary Guide, eRED_POS Rev. D, M00167303](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revD.pdf) — 直接アクセスでは 403、全文はプロキシ経由で取得）:

- 機器ごとに一意の工場出荷時デフォルトパスワードが設定され、ラベルに印刷されています（ステータスシートでは "Initial Password" と表示）。[Web Config Reference Guide RevG](https://download4.epson.biz/sec_pubs/bs/pdf/TM-m30III_m50II_P20II_P80II_WebConfig_rg_en_RevG.pdf)（プロキシ経由で取得）には、モデルに応じて「初期パスワードは製品に貼付されたラベルに記載されている」と「初期パスワードは製品のシリアル番号である」という両方の表現があります。同じパスワードで Web Config、パネルロック、EpsonNet Config が保護されます。
- オンライン通信には認証と暗号化が必要です。ファームウェア更新および機密性の高い設定には管理者パスワードが必要で、監査ログが追加されました（デフォルトで有効。Web Config → 製品セキュリティ → 監査ログ）。
- RED 対象機器では、SNMPv3 のデフォルト認証アルゴリズムは SHA2-256 です。

**RED の対象モデル**（一次資料、eRED Rev. D の表 — CE マーク市場向け機器）: TM-H6000VI（すべて）、TM-L100（Serial/USB モデルを除くすべて）、TM-m30II-S、TM-m30II-SL、TM-m30III、TM-m30III-H、TM-m50、TM-m50II、TM-P20II、TM-P80II、TM-P80II Auto Cutter、TM-T20IV（Serial/USB モデルを除くすべて）、TM-T88VII（すべて）。対象インターフェース: Ethernet、無線 LAN（内蔵でない場合は OT-WL06 ドングル）、Bluetooth。

**デフォルト状態**: 「RED の対象となるすべての製品で、セキュア印刷設定はデフォルトで有効です。」（eRED Rev. D、一次資料）

**ポートマトリクス**（一次資料、eRED Rev. D）:

| 経路 | セキュア印刷が有効（デフォルト） | 無効 |
|---|---|---|
| ポート 9100（RAW） | 印刷不可 | 印刷可能 |
| ポート 9143（TLS RAW） | 印刷可能（暗号化） | 印刷可能（暗号化） |
| ポート 80（HTTP ePOS） | 印刷不可 | 印刷可能 |
| ポート 443（HTTPS ePOS） | 印刷可能（暗号化） | 印刷可能（暗号化） |
| ポート 8008 / 8009（ePOS SDK） | 印刷不可 | 印刷可能 |
| ポート 8043 / 8143（ePOS SDK TLS） | 印刷可能（暗号化） | 印刷可能（暗号化） |
| Bluetooth クラシック | 印刷可能（暗号化） | 印刷可能 |

さらに RED ファームウェアでは（トグルの設定にかかわらず）、LPR ポート印刷は無効（以前は有効）、TLS 1.0/1.1 は無効、SSL/TLS 暗号化強度は高（以前は中）です。

**症状の特徴**: eRED Rev. D には、RED ユニットをレガシーシステムに追加すると「そのまま接続した場合は正常に印刷されない」とだけ記載されており、暗号化は「パフォーマンスに影響する可能性がある」とされています。ステータスは正常と表示されたまま約 4 分間保留され、その後破棄されるという具体的な挙動は、公開ドキュメントではなく既知のコンテキスト（fw 13.21、TM-m30III）に基づいています。

**承認されたセキュアな経路**（一次情報、eRED Rev. D）: RED 対応ソフトウェアを使用します。すなわち、記載された最小バージョン以上のドライバー/SDK（APD 6 ≥ 6.10、JavaPOS ADK ≥ 1.14.38、OPOS ≥ 3.00E R27、ePOS SDK Android/iOS ≥ 2.33.0、ePOS SDK JavaScript ≥ **2.27.0f**、TM Utility ≥ 3.38.0、EpsonNet Config ≥ 4.9.11、TM Virtual Port Driver ≥ 8.70d、Mac driver ≥ 3.0.1）を使用します。または、TM Virtual Port Driver で Ethernet/BT を仮想シリアルポートにマッピングします。これにより「アプリケーションを変更することなく ESC/POS データを自動的に暗号化」できます。それ以外の RAW ESC/POS アプリは、USB/Serial/Parallel 経由でのみ動作します。RED 対応 OS の一覧には Linux、Win 7/8/POSReady は含まれません。macOS には TM-m30III fw ≥ 13.17 が必要です。RED ユニットに*対応していない*ソフトウェア（セキュア印刷を無効にした場合にのみ動作）には、Mac driver（3.0.1 より前）、Linux CUPS driver、TM Bluetooth Connector、Send Data Tool などがあります。

**対処法 / 無効化**: この設定は「TM Utility、Web Config、または EpsonNet Config（Web バージョン）」で切り替え可能です（eRED Rev. D。 [Shopify の TM-m30II トラブルシューティング](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting)でも同じ 3 つが挙げられています）。すべての設定変更時に管理者パスワードの入力が求められます（eRED Rev. D）。**管理者パスワードなしでセキュア印刷を無効化する方法は文書化されていません**。パスワードを知らない状態で USB/Bluetooth 経由の TM Utility を使用する方法についても、確認できませんでした。Bluetooth 専用の TM-P20II/P80II では、設定変更は Epson Deployment Tool で行います（eRED Rev. D）。Epson の EU FAQ（[KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us)、一次情報の取得および検索結果の記録）によると、レガシーシステムではポート 9100 と LPR を手動で再有効化する必要があり、「ファームウェア更新により、RED 指令で定められた法的要件として RED 準拠設定が標準設定にリセットされます」（二次情報の表現。同じ FAQ 群の検索結果からの引用であり、取得したページでは 9100/LPR に関する文を直接確認しました）。

**識別方法**（一次情報、eRED Rev. D）: ネットワークステータスシートを印刷します（カバーを開いた状態でフィードボタンを 1 秒以上押す、またはステータスシートボタンを 3 秒以上押す）。`Security Mode: RED` = RED が有効、`Normal` / `PSTI` / `Internal` / 表示なし = RED は無効です。Lightspeed はさらに、「RED 準拠ハードウェアを外観から識別する方法はなく、箱の中に追加の情報シートが入っている」と説明しています（[プリンターの設定](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)）。

**ファームウェアバージョン**: Secure Printing を特定バージョンに結び付けるモデル別ファームウェアバージョンの公開リストは見つからなかった（epson のダウンロードホストにあるリリースノート PDF は 403）。判明済み: TM-m30III fw 13.21 にはこれが含まれる（確立済みのコンテキスト）。macOS RED サポートには TM-m30III fw ≥ 13.17 が必要（eRED Rev. D）。

## Star Micronics {#star-micronics}

**該当情報なし。** Radio Equipment Directive、EN 18031、またはデフォルトで安全な印刷ブロックモードに言及する RED に関する記述、セキュリティ通知、ファームウェアリリースノートは見つからなかった。starmicronics.com ヘルプセンター、star-m.jp オンラインマニュアル、Star Micronics Cloud のお知らせ、POS ベンダーのヘルプセンターを検索した。

存在しないことを示す証拠（すべて一次情報）:
- 現行の [TSP100IV 一般仕様マニュアル Rev 2.20](https://www.starasia.com/Download/Manual/tsp100iv_spc_en.pdf): TCP#9100 のデフォルトは **有効**。Web 設定の `root`/`public`、telnet の `root`/`public`、`user`/`guest` は工場出荷時のデフォルト。RED/EN 18031/セキュリティモードに関する記載はない。この仕様によれば、Raw StarPRNT LAN 印刷はデフォルトで引き続き開放されている。
- [TSP100IV オンラインマニュアル — 詳細設定（LAN）](https://star-m.jp/products/s_print/oml/tsp100iv/manual/en/settings/DNSsettings.htm): TCP#9100/9101、UDP#22222、LPR はすべてデフォルトで有効。無効にするには fw ≥ 1.1 が必要（Telnet のデフォルトも fw 1.1 で無効に変更された）。
- 同じマニュアル系列から検索で取得した二次情報: デフォルトパスワードで Web 設定にログインすると、設定を変更する前にパスワード変更画面が強制的に表示される。これは Star の EN 18031 に近い強化策と思われるが、印刷はブロックしない。
- [Shopify の mC-Print3 トラブルシューティング](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/mC-Print3/troubleshooting)には RED/セキュリティ項目が**ない**（一次情報として取得）。また、[Lightspeed の RED に関する注記](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)は明示的に Epson 専用（"他のすべてのプリンターモデルでは無効"）である。

注意: Rev 2.20 の仕様は 2025-08 以降の EU 向けハードウェア改訂版より前の可能性がある。文書がないことは、Star の EU 在庫に変更がない証拠ではない。ただし、この調査時点で Star の Raw 印刷障害に関する現場報告やベンダー文書はゼロである。判定: Star ではデフォルトで安全な Raw 印刷ブロックはない — 中程度の確信、存在しないことを示す証拠。

## Bixolon {#bixolon}

[BIXOLON Compliance（bixoloneu.com）](https://bixoloneu.com/bixolon-compliance/)の一次情報:

- 「プリンターを 2025 年 8 月 1 日以降にヨーロッパ、中東、またはアフリカ（EMEA）で購入した場合、EU Radio Equipment Directive（RED）に準拠するよう設計された強化セキュリティ機能が搭載されています。」
- "プリンターの初期設定時に、Protected Mode パスワードの作成と Protected Mode の有効化が必要になります。これらを完了するまで、一部の設定オプションは変更できません。"
- 詳細は「BIXOLON's Wi-Fi Connection Manual」に記載されています。EN 18031 への適合は、bixolon.com の EN18031 DoC に文書化されています。

デフォルト状態: 初期設定時に Protected Mode の設定が強制されます（設定制限）。**印刷（raw 9100 など）がデフォルトでブロックされるという根拠は見つかりませんでした**。文書化された変更は印刷経路ではなく設定を制限するものです。想定される症状: Protected Mode パスワードを作成するまで、セットアップウィザードやユーティリティが失敗します。対処法: Wi-Fi Connection Manual に従って Protected Mode の設定を完了します。モデル一覧: 適合性ページでは公開されていません。

## Citizen Systems {#citizen-systems}

**該当情報は見つかりませんでした。** [Citizen の製品セキュリティページ](https://www.citizen-systems.co.jp/en/printer/support/product_security/)（一次情報）には RED/EN 18031 に関する内容や 2025 年のファームウェア勧告はなく、「当社製品では脆弱性は確認されていません」と記載されています。citizen-systems.com でも、CT-S/CT-E モデルに関する RED 関連のお知らせは確認できませんでした。

## Seiko Instruments (SII) {#seiko-instruments-sii}

**該当情報は見つかりませんでした。** RP-F10/RP-E10 のドキュメントで参照されているのは EMC/LVD/RoHS 指令のみであり、sii-ps.com / sii-thermalprinters.com では RED サイバーセキュリティ通知、セキュリティモード、または 2025 年のファームウェア変更は確認できませんでした。

## Munbyn、HPRT、Rongta {#munbyn-hprt-rongta}

**該当情報は見つかりませんでした。** 3 社のいずれについても、RED/EN 18031 適合宣言またはセキュアなデフォルト設定に関するドキュメントはありません。（2022/30 に対する低価格ブランドの EU 適合状況は公開文書化されておらず、EU 市場向けユニットは単に未試験である可能性があります。）

## POS ベンダーのガイダンスページ {#pos-vendor-guidance-pages}

- **Shopify** — 少なくとも 3 つの Epson トラブルシューティングページに RED の記載があります: [TM-m30II](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting)、[TM-m30III](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30iii/troubleshooting)（確立済みのコンテキスト）、および [T88 シリーズ](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsont88-series/troubleshooting)。文言（一次情報の取得結果）: 「RED（無線機器指令）が有効なプリンターは現在動作しません」、「RED の対象となるすべての製品では Secure Printing がデフォルトで有効です」。対処法は、TM Utility、Web Config、または EpsonNet Config で Secure Printing を無効にすることです。Shopify の方針は無効化すること（セキュア経路はサポートされていません）。Star/Bixolon の RED ページは見つかりませんでした。
- **Lightspeed Restaurant K-Series** — *認可された* 経路をサポートしていることが確認できた唯一のベンダーです。[プリンターの設定](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer)では、Back Office の「セキュア印刷を有効にする」切り替えについて、「EU および英国の Epson プリンターでは有効にする必要があり、その他のすべてのプリンターモデルでは無効です」と説明されています。「印刷にわずかな遅延」が発生することを警告し、RED 対象ユニットを識別するには同梱の案内シートを確認するよう案内しています。[TM-L100 のセットアップページ](https://k-series-support.lightspeedhq.com/hc/en-us/articles/31036519879707-Epson-TM-L100-thermal-printer-setup)でも同様に記載されています（「（EU/UK のみ）［セキュア印刷を有効にする］のチェックボックスをオンにします」）。また、テスト伝票が失敗する場合は無効化する手順がトラブルシューティングフローに含まれています（検索結果のキャプチャによる二次情報）。対象は Epson のみです。
- **Square、Loyverse、Toast、SumUp、Zettle、Epos Now** — 今回の調査では該当なし。RED またはセキュア印刷に言及するヘルプセンターページは見つかりませんでした。
- 二次情報: [HP サポートには、Engage POS 製品ライン向けの「Epson プリンター - EU RED 要件」文書があります](https://support.hp.com/in-en/document/ish_13029629-13029677-16)（取得が 2 回タイムアウトしたため内容は未確認。存在についての二次情報のみ）。

## 対象範囲 {#scope-boundaries}

- **USB／シリアル／パラレル専用の運用は対象外**: 「USB インターフェイス接続、シリアルインターフェイス接続、またはパラレルインターフェイス接続のみで動作する業務システムを開発する場合、システム開発で RED との互換性を確保する必要はない。」（eRED Rev. D、一次情報）。
- **RED 対象機器の有線 Ethernet は免除されない**: 「RED は無線機器に関する法規制である。Ethernet インターフェイス接続のみを使用している場合でも、システム開発は RED に対応している必要がある。」（eRED Rev. D、一次情報）。つまり、Ethernet 経由で使用する TM-m30III でもセキュア印刷は適用されます。この機器には無線機能が搭載されているため、製品全体で RED が有効になります。「Ethernet を使っているので RED は適用されない」と案内しないでください。
- **Epson の対象外改造シート**（一次情報、[Non_RED_sht_en_RevA.pdf「RED 規制の対象外となるよう改造された製品」、M00169200](https://download4.epson.biz/sec_pubs/bs/pdf/Non_RED_sht_en_RevA.pdf)、プロキシ経由で取得）: Epson は、従来製品を 2022/30 の「インターネット接続」トリガーの対象外に保つため、*外部インターネットアクセス*を制限しました（NTP はローカルネットワークに限定、自動 CA 証明書更新は無視）。対象は TM-m30II（内蔵 Ethernet／OT-WL06）、TM-L90（UB-E04）、TM-U220IIB（UB-E04）、TM-T20III（内蔵 Ethernet）、TM-S2000II-NW、UB-E04 ボード、UB-R05 Wi-Fi ボードです（UB-R05 は RED 対応の TM-T88VII ではサポート終了）。これらの機器ではステータスシートに `Security Mode: Normal`、`PSTI`、または `Internal` と表示され、従来どおりに動作します（セキュア印刷なし）。
- **EU 域外市場向け機器**: すべてのベンダー声明は機種ではなく市場への投入時期に変更を限定しています。Epson は「2025 年 8 月 1 日以降に EU、英国、EFTA 市場に投入された」機器（[EU FAQ KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us)）、eRED は「CE マークが必要な国向け」の機器、Bixolon は「2025 年 8 月 1 日以降に EMEA で購入された」機器、Lightspeed は「EU および英国に輸入された」機器を対象としています。ステータスシートに異なる `Security Mode` 値（RED／PSTI／Normal／Internal）があることから、RED が全地域で有効なわけではなく、市場ごとのセキュリティモードを持つ共通ファームウェアであると考えられます（PSTI は英国の製品セキュリティ制度）。推測: 米国／オーストラリア市場向け在庫ではセキュア印刷はオフ（`Normal` または空欄）で出荷されますが、他地域で購入した並行輸入品／EU 調達品は RED が有効になります。米国／オーストラリアについての直接的な確認は見つからなかったため、推測として扱ってください。

## WCPOS ドキュメント／プリンターウィザードへの影響 {#implications-for-wcpos-docs--printer-wizard}

用意すべき障害モードの項目:

1. **Epson RED 対象機器、raw 9100 または HTTP ePOS パス**: プリンターは正常と報告しているにもかかわらず、ジョブが消失します（保留後に破棄）。接続テストは成功する場合があります。検出方法: RED リストの機種 + EU／英国市場 + ポートプローブ（443 は ePOS に応答する一方で 80／8008 は応答しない → セキュア印刷がオンである可能性が高い、80 が応答する → オフ）。対処ページ: ステータスシートを印刷 → `Security Mode: RED` を確認 → WebConfig → 印刷 → セキュア印刷 → 無効化（管理者パスワード = シリアル番号、または箱／本体ラベル）— **ファームウェア更新により再び有効になる**ため、更新後には再適用する必要があること（または統合を TLS パスへ移行すること）も警告します。
2. **推奨する長期的な方法**: WCPOS は RED 対象機器で HTTPS ePOS（443）／ePOS-Device（8043）を使用して印刷し、セキュア印刷を有効のまま維持すべきです。これは Epson の認可済みパスおよび Lightspeed のアプローチに一致し、ファームウェア更新後の再発ループを避けられます。ウィザードでは、全員に無効化を案内するのではなく、ポートプローブに基づいて分岐する必要があります。
3. **Epson の有線 Ethernet に関する注意事項**: 「Ethernet 専用でも免除されない」— 機器の無線機能により対象範囲に含まれます。USB／シリアル専用モデル（および Non_RED 改造済み従来機種リスト）のみが免除されます。
4. **ウィザードの識別手順**: ネットワークステータスシートを印刷するよう案内します（カバーを開けた状態でフィードボタンを1秒以上 / ステータスボタンを3秒以上）。`Security Mode:` と `Initial Password:` を確認します。これは唯一信頼できるRED検出方法です。箱の表記は信頼できません（Lightspeed）。
5. **Bixolon EMEA の項目**: 初期設定では、設定変更前に保護モードのパスワードを作成する必要があります。Bixolon EMEA機器向けのウィザード文言では、必須のパスワード設定手順を考慮してください。印刷経路のブロックは文書化されていないため、この項目は設定に限定してください。
6. **Star の項目**: REDに関する変更はありません。Star REDの障害モードを追加しないでください。raw 9100で失敗するStar機器には別の原因があります（fw < 1.1ではポートの切り替えもできず、デフォルトでは開放されています）。調査後にStarがEU向けハードウェアの改訂版を出荷した場合は、再確認してください。
7. **EU域外のユーザー**: REDの動作は機器が*販売された*地域（EU/UK/EFTA/EMEA）に従うため、AU/USの加盟店では通常発生しないことを記載してください。ただし、輸入品またはグレーマーケット品は例外です。
8. サポートがモデル、販売地域、ステータスシートに基づいて一度にトリアージできるよう、影響を受けるEpsonモデルの一覧（上記13ファミリー）をドキュメントに残してください。

## 情報源一覧 {#source-index}

一次情報: [eRED_POS Rev. D](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revD.pdf)（プロキシ経由で取得。Rev. B/CのURLも有効: [revB](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revB.pdf)、[revC](https://download4.epson.biz/sec_pubs/bs/pdf/eRED_POS_revC.pdf)） · [Non_RED_sht_en_RevA](https://download4.epson.biz/sec_pubs/bs/pdf/Non_RED_sht_en_RevA.pdf)（プロキシ経由で取得） · [Epson WebConfig RG RevG](https://download4.epson.biz/sec_pubs/bs/pdf/TM-m30III_m50II_P20II_P80II_WebConfig_rg_en_RevG.pdf)（プロキシ経由で取得） · [Epson EU FAQ KA-01896](https://www.epson.eu/en_EU/faq/KA-01896/contents?loc=en-us) · [Bixolon Compliance](https://bixoloneu.com/bixolon-compliance/) · [Shopify TM-m30II](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsontmm30ii/troubleshooting) / [T88](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/epsont88-series/troubleshooting) / [mC-Print3](https://help.shopify.com/en/manual/sell-in-person/hardware/receipt-printers/mC-Print3/troubleshooting) · [Lightspeedのプリンター設定](https://k-series-support.lightspeedhq.com/hc/en-us/articles/11242027744539-Setting-up-a-printer) / [TM-L100](https://k-series-support.lightspeedhq.com/hc/en-us/articles/31036519879707-Epson-TM-L100-thermal-printer-setup) · [Star TSP100IV仕様 Rev 2.20](https://www.starasia.com/Download/Manual/tsp100iv_spc_en.pdf) · [Star TSP100IV LAN設定マニュアル](https://star-m.jp/products/s_print/oml/tsp100iv/manual/en/settings/DNSsettings.htm) · [Citizen製品セキュリティ](https://www.citizen-systems.co.jp/en/printer/support/product_security/)。
二次情報／未検証: ファームウェア更新でREDがリセットされる旨の文言（Epson FAQ検索キャプチャ） · 初回ログイン時にパスワード変更を強制するStarの挙動（star-m.jpマニュアル検索キャプチャ） · [HP「Epsonプリンター - EU RED要件」](https://support.hp.com/in-en/document/ish_13029629-13029677-16)（取得がタイムアウト） · テスト失敗時に無効化するLightspeedのフロー（検索キャプチャ）。
