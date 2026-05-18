const sidebars = require('../../versioned_sidebars/version-1.x-sidebars.json');

describe('versioned docs sidebar', () => {
  it('includes the refunds page under Orders', () => {
    const ordersCategory = sidebars.sidebar.find(
      (item) => item.type === 'category' && item.label === 'Orders'
    );

    expect(ordersCategory).toBeDefined();
    expect(ordersCategory.items).toContain('orders/refunds');
  });
});
