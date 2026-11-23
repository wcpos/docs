// Shared helpers for shot files.

// Turns on every switch inside `scope` (a CSS/Playwright selector), one click at a time and re-reading after
// each click, because turning one on can reveal more. Clicks only switches that are off, so a re-run is a no-op.
// Blurs the last switch so no focus ring is captured.
export async function switchesOn(page, scope) {
  for (let i = 0; i < 10; i += 1) {
    const off = page.locator(`${scope} button[role="switch"][aria-checked="false"]`).first();
    if (!(await off.count())) break;
    await off.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  }
  await page.evaluate(() => document.activeElement?.blur());
}
