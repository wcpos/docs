// Pure: build the copy-paste support summary from collected answers.
// Keep labels stable (support triage greps these).

const PRINTER_LINES = [
  ['Printer location', (a) => a.where],
  ['Wants to print', (a) => a['what-print']],
  ['Cloud provider', (a) => a['cloud-provider']],
  ['Platform', (a) => a.platform],
  ['Browser', (a) => a.browser],
  ['Version', (a) => a.version],
  ['POS scheme', (a) => a.scheme],
  ['Connection', (a) => a.connection],
  ['Vendor', (a) => a.vendor],
  ['Model', (a) => a.model],
  ['IP/port', (a) => (a.ip ? `${a.ip}${a.port ? ':' + a.port : ''}` : undefined)],
  ['Paper width', (a) => a.width],
  ['Symptom', (a) => a.symptom],
];

const SCANNER_LINES = [
  ['Goal', (a) => a.start],
  ['Platform', (a) => a['platform-setup'] || a['platform-trouble']],
  ['Browser', (a) => a['browser-setup'] || a['browser-trouble']],
  ['Symptom', (a) => a['symptom-d'] || a['symptom-w'] || a['symptom-a'] || a['symptom-i']],
  ['Connection', (a) => a.conn],
  ['Brand', (a) => a.brand],
];

export function summarize(state) {
  const a = state.answers || {};
  const isScanner = a.start != null;
  const out = [`WCPOS ${isScanner ? 'scanner' : 'printer'} setup — support summary`, '----------------------------------------'];
  for (const [label, get] of isScanner ? SCANNER_LINES : PRINTER_LINES) {
    const v = get(a);
    if (v != null && v !== '') out.push(`${label}: ${v}`);
  }
  if (!isScanner && (a.selftestCert || a.selftest9100 || a.selftestDhcp)) {
    out.push(`Self-test: cert=${a.selftestCert || '?'}, tcp9100=${a.selftest9100 || '?'}, dhcp=${a.selftestDhcp || '?'}`);
  }
  const path = [...(state.history || []), state.currentId];
  out.push(`Path: ${path.join(' → ')}`);
  out.push(`Stuck at: ${state.currentId}`);
  return out.join('\n');
}
