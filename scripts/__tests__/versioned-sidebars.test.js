/* global describe, it, expect */
const sidebars = require('../../versioned_sidebars/version-1.x-sidebars.json');

describe('versioned error-code sidebar', () => {
  it('lists SYNC331 in the SYNC category', () => {
    const help = sidebars.sidebar.find(
      ({ label }) => label === 'Help & Troubleshooting'
    );
    const errorCodes = help.items.find(
      ({ label }) => label === 'Error codes (1.10+)'
    );
    const sync = errorCodes.items.find(({ label }) => label === 'SYNC');

    expect(sync.items).toContain('error-codes/SYNC331');
  });
});
