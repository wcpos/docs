// WP Admin shots for versioned_docs/version-2.x/receipts/cloud-printing (Cloud Print), in page order.
export const journey = 'CP';

const app = '#woocommerce-pos-settings';
const section = (heading) => `${app} main div:has(> div > div > h3:text-is("${heading}"))`;
const dialog = '[role="dialog"]';
const url = 'wp-admin/admin.php?page=woocommerce-pos-settings#/cloud-print';

// The browser never reaches PrintNode, Star Online or the WCPOS relay; nothing here presses
// Fetch my printers, Fetch my devices or Test print, and Setup & token is never opened.
// The shots share one URL, and a goto that changes nothing but the hash keeps the last shot's open
// dialog, so each shot reloads the screen.
const offline = async (page) => {
  await page.route(/printnode\.com|stario\.online|cloudprint\.wcpos\.com/, (route) => route.abort());
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('cloud-print-add').waitFor({ state: 'visible' });
};

const openWizard = async (page) => {
  await offline(page);
  await page.getByTestId('cloud-print-add').click();
  await page.getByTestId('provider-choice-printnode').waitFor({ state: 'visible' });
};

export default [
  {
    step: 1,
    slug: 'printers',
    url,
    prepare: offline,
    crop: [section('Your cloud printers')],
    pins: [
      { name: 'printer-name', selector: '[data-testid="printer-card-name-kitchen-printer"]' },
      { name: 'printer-status', selector: '[data-testid="printer-card-status-kitchen-printer"]' },
      { name: 'last-check-in', selector: '[data-testid="printer-card-last-seen-kitchen-printer"]' },
      { name: 'printer-id', selector: 'dd:has([data-testid="printer-card-id-info-kitchen-printer"]) > code' },
      { name: 'test-print', selector: '[data-testid="printer-card-test-kitchen-printer"]' },
      { name: 'printer-actions', selector: '[data-testid="printer-card-menu-kitchen-printer"]' },
      { name: 'add-printer', selector: '[data-testid="cloud-print-add"]' },
    ],
    alt: 'WP Admin, POS → Settings → Cloud Print, Your cloud printers: the Kitchen printer card (Star CloudPRNT, Waiting for printer, last check-in never, printer ID kitchen-printer) with Test print and its actions menu, and + Add a printer.',
  },
  {
    step: 2,
    slug: 'choose-type',
    url,
    prepare: openWizard,
    crop: [dialog],
    pad: 0,
    pins: [
      { name: 'provider-printnode', selector: '[data-testid="provider-choice-printnode"]' },
      { name: 'provider-star-online', selector: '[data-testid="provider-choice-star-online"]' },
      { name: 'provider-star-cloudprnt', selector: '[data-testid="provider-choice-star-cloudprnt"]' },
      { name: 'provider-epson', selector: '[data-testid="provider-choice-epson-sdp"]' },
      { name: 'continue', selector: '[data-testid="wizard-continue"]' },
    ],
    alt: 'WP Admin, Cloud Print, Add a cloud printer dialog: What kind of printer are you connecting? with PrintNode, Star Online, Star CloudPRNT and Epson Server Direct Print, and the Continue button.',
  },
  {
    step: 3,
    slug: 'printnode-key',
    url,
    // PrintNode → Continue shows the name and key fields; the key stays empty and Fetch is not pressed.
    prepare: async (page) => {
      await openWizard(page);
      await page.getByTestId('provider-choice-printnode').click();
      await page.getByTestId('wizard-continue').click();
      await page.getByTestId('wizard-name-input').fill('Back office printer');
      await page.getByTestId('wizard-printnode-api-key').waitFor({ state: 'visible' });
    },
    crop: [dialog],
    pad: 0,
    pins: [
      { name: 'printer-name', selector: '[data-testid="wizard-name-input"]' },
      { name: 'api-key', selector: '[data-testid="wizard-printnode-api-key"]' },
      { name: 'fetch-printers', selector: '[data-testid="wizard-printnode-fetch"]' },
    ],
    alt: 'WP Admin, Cloud Print, Add a cloud printer for PrintNode: Printer name Back office printer, an empty PrintNode API key field, the Fetch my printers button and the PrintNode printer ID field.',
  },
  {
    step: 4,
    slug: 'auto-print-rules',
    url,
    prepare: offline,
    crop: [section('Auto-print rules')],
    pins: [
      { name: 'rule-orders', selector: '[data-testid="rule-scope-0"]' },
      { name: 'rule-printer', selector: '[data-testid="rule-printer-0"]' },
      { name: 'rule-template', selector: '[data-testid="rule-template-0"]' },
      { name: 'rule-copies', selector: '[data-testid="rule-copies-0"]' },
      { name: 'rule-trigger', selector: '[data-testid="rule-trigger-0"]' },
      { name: 'add-rule', selector: '[data-testid="rules-add"]' },
    ],
    alt: "WP Admin, Cloud Print, Auto-print rules: one rule reading Automatically print every in-store (POS) order to Kitchen printer using the Simple Thermal Receipt (80mm) template, 1 copy, as soon as it's created, and + Add rule.",
  },
];
