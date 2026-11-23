# wp-admin-shots

Cropped, light-theme WP Admin screenshots for the docs, taken from a local wp-env that runs the
current `main` builds of woocommerce-pos and woocommerce-pos-pro, seeded with fictional data
(Harbour and Vine: three stores, four staff, eight products; every email `@example.com`).
The seed adds four POS login sessions: Maya on desktop and web, Leo on iPad, and Priya on Android; none for Sam or the admin.

## Prerequisites

- Docker running; Node 20+; `gh` authenticated (the plugin builds are the `deployment-package`
  artifacts of each repo's `Deploy to Dev Site` workflow on `main`).
- Once, in this folder: `PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install` (its own lockfile, never the repo root).
  `npm install` fetches no browser, so then, also in this folder: `npx playwright install chromium`
  (the Chromium that matches the locked Playwright; `capture.mjs` launches it).
- For `pos` only: the released WCPOS desktop app (macOS arm64), unpacked into `.cache/app/`:
  `gh release download v2.0.6 -R wcpos/electron -p 'WCPOS-darwin-arm64-2.0.6.zip' -D .cache/app-download`
  then `ditto -x -k .cache/app-download/WCPOS-darwin-arm64-2.0.6.zip .cache/app`.

## Commands (from the repo root)

```sh
node tools/wp-admin-shots/capture.mjs up                    # fetch builds, start wp-env on a free port from 8890, seed
node tools/wp-admin-shots/capture.mjs shoot stores/setup    # PNGs + static/img/2.x/stores/setup/en/wp-admin.json
node tools/wp-admin-shots/capture.mjs pos stores/setup      # desktop app's Choose a store (tablet) + manifest.json
node tools/wp-admin-shots/capture.mjs verify stores/setup   # sizes, pins, alt text, leak checks
node tools/wp-admin-shots/capture.mjs down                  # stop this tool's env only
```

`pos <page> [--app <WCPOS.app or its executable>]` needs the env `up`. The web build at `/pos` skips
Connect and Choose a store, so it drives the desktop app (Playwright's Electron driver) with a
throwaway profile in `.cache/pos-profile` (emptied every run; the app's real data is never touched),
connects it to this env, signs in as Maya Chen and picks Harbour Street. Maya's password is the
literal `password`, a throwaway for this local container like wp-env's own `admin`/`password`.
The seed also turns the POS setting `force_ssl` off, so `/pos` stays on plain http.

`up` is idempotent: it reuses the ports in `.cache/state.json`, downloads a build only when `main`
moved, and the seed finds everything before creating it. `--free-dir`/`--pro-dir <dir>` use a
built plugin folder instead of the artifact.

## Adding a page

1. Add `shots/<docs path with / replaced by ->.mjs` exporting `journey` (the file prefix, e.g. `'SS'`)
   and a default array of `{ step, slug, url, variant?, prepare?, crop, pad?, padBottom?, maxHeight?, pins, alt }`.
   `url` may use `{storeId:<store name>}` or `{productId:<product name>}`.
   `variant: 'free'` deactivates Pro for that shot and reactivates it afterwards, even on failure; any other value means `'pro'`, and the manifest records the variant.
2. Seed anything new in `seed.php` (find before create).
3. `shoot` then `verify`, open every PNG, and use the manifest in the page:
   `import m from '@site/static/img/2.x/<page>/en/wp-admin.json'` with `<JourneyShot manifest={m} device="desktop" step={N} … />`.
