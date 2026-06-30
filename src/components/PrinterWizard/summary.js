// Pure: build the copy-paste support summary from collected answers.
// Keep labels stable (support triage greps these).

const LINES = [
  ['Printer location', (a) => a.where],
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

export function summarize(state) {
  const a = state.answers || {};
  const out = ['WCPOS printer setup — support summary', '----------------------------------------'];
  for (const [label, get] of LINES) {
    const v = get(a);
    if (v != null && v !== '') out.push(`${label}: ${v}`);
  }
  if (a.selftestCert || a.selftest9100 || a.selftestDhcp) {
    out.push(`Self-test: cert=${a.selftestCert || '?'}, tcp9100=${a.selftest9100 || '?'}, dhcp=${a.selftestDhcp || '?'}`);
  }
  const path = [...(state.history || []), state.currentId];
  out.push(`Path: ${path.join(' → ')}`);
  out.push(`Stuck at: ${state.currentId}`);
  return out.join('\n');
}
