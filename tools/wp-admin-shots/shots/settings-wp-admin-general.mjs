// WP Admin shots for versioned_docs/version-2.x/settings/wp-admin/general.mdx, in page order.
import { switchesOn } from './lib.mjs';

export const journey = 'GN';

const S = '#woocommerce-pos-settings';
const section = (heading) => `${S} main > div:has(h3:text-is("${heading}"))`;
const GENERAL = 'wp-admin/admin.php?page=woocommerce-pos-settings';

export default [
  {
    step: 1,
    slug: 'register',
    url: GENERAL,
    prepare: (page) => switchesOn(page, section('Register')),
    crop: [section('Register')],
    pins: [
      { name: 'open-close', selector: `${section('Register')} button[role="switch"] >> nth=0` },
      { name: 'ask-manager', selector: `${section('Register')} button[role="switch"] >> nth=1` },
      { name: 'remind', selector: `${section('Register')} button[role="switch"] >> nth=2` },
    ],
    alt: 'The Register section of General with WCPOS Pro: Open and close the register, Ask a manager when the count is out and Remind the cashier to close, all on, as site defaults each store can customise.',
  },
  {
    step: 2,
    slug: 'privacy',
    url: GENERAL,
    crop: [section('Privacy')],
    pins: [
      { name: 'choice', selector: `${S} [data-testid="privacy-undecided-prompt"]` },
      { name: 'usage-data', selector: `${section('Privacy')} button[role="switch"]` },
      { name: 'learn-more', selector: `${section('Privacy')} a:has-text("Learn what")` },
    ],
    alt: 'The Privacy section of General: the prompt asking whether WCPOS can send usage data and error reports, with Allow and No thanks, then the Allow anonymous usage data and error reports switch and its Learn what is collected link.',
  },
];
