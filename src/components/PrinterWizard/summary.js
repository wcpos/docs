// Pure: build the copy-paste support summary from collected answers.
// Keep labels stable (support triage greps these).

const LINES = [
  ['Printer location', (a) => a.where],
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
  ['Cloud provider', (a) => a['cloud-provider']],
  ['CloudPRNT status', (a) => a['g-cloud-cp-status']],
  ['CloudPRNT retry', (a) => a['g-cloud-cp-retry']],
  ['CloudPRNT test print', (a) => a['g-cloud-cp-test']],
  ['Cloud template retry', (a) => a['g-cloud-template-retry']],
  ['Epson SDP status', (a) => a['g-cloud-sdp-status']],
  ['Epson SDP test print', (a) => a['g-cloud-sdp-test']],
  ['PrintNode status', (a) => a['g-cloud-pn-status']],
  ['PrintNode retry', (a) => a['g-cloud-pn-retry']],
  ['PrintNode test print', (a) => a['g-cloud-pn-test']],
  ['PrintNode job retry', (a) => a['g-cloud-pn-job-retry']],
  ['Star Online fetch', (a) => a['g-cloud-so-fetch']],
  ['Star Online fetch retry', (a) => a['g-cloud-so-retry']],
  ['Star Online test print', (a) => a['g-cloud-so-test']],
  ['Star Online job retry', (a) => a['g-cloud-so-job-retry']],
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
  out.push(`Stuck at: ${state.currentId}`);
  return out.join('\n');
}
