// How far inside an element's left edge a pin sits, in viewport pixels, so the
// pin does not cover the element's text.
const PIN_INSET_PX = 12;

const percent = (value, total) => Math.round((value / total) * 1000) / 10;

/**
 * Picks one capture from a capture manifest and returns the props PinnedShot
 * needs: the image path and its pins as [x, y] percentages of the viewport, in
 * the manifest's pin order. Throws when no capture matches, so the build fails.
 */
export function journeyShotProps(
  manifest,
  { device, step, colorScheme = 'light', scale = 'regular' }
) {
  const capture = manifest.captures.find(
    (c) =>
      c.device === device &&
      c.step === step &&
      c.colorScheme === colorScheme &&
      c.scale === scale
  );
  if (!capture) {
    throw new Error(
      `JourneyShot: no capture for device "${device}" step ${step} (${colorScheme}, ${scale}) in ${manifest.page}`
    );
  }
  const pageDir = manifest.page.split('/').slice(0, -1).join('/');
  const src = `/img/2.x/${pageDir}/${manifest.locale}/${capture.file}`;
  const { width, height } = capture.viewport;
  const pins = (capture.pins || []).map(({ box }) => [
    percent(box.x + Math.min(PIN_INSET_PX, box.width / 2), width),
    percent(box.y + box.height / 2, height),
  ]);
  return { src, pins };
}
