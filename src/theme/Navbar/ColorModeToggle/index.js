/**
 * Swizzled to render nothing.
 *
 * The light/dark/system switcher lives in the footer now (see
 * src/theme/Footer/Layout), mirroring wcpos.com. We hide it here instead of
 * setting `colorMode.disableSwitch: true` on purpose: disableSwitch wipes the
 * visitor's persisted theme choice on every load (theme-common clears
 * ColorModeStorage when disableSwitch is on), which would break the footer
 * toggle's persistence. Returning null keeps the color-mode context — and the
 * stored choice — fully intact; it only removes the navbar button.
 */
export default function NavbarColorModeToggle() {
  return null;
}
