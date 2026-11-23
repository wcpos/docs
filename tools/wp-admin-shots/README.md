# wp-admin-shots

Cropped, light-theme WP Admin screenshots for the docs, taken from a local wp-env that runs the
current `main` builds of woocommerce-pos and woocommerce-pos-pro, seeded with fictional data
(Harbour & Vine: three stores, four staff, eight products; every email `@example.com`).

## Prerequisites

- Docker running; Node 20+; `gh` authenticated (the plugin builds are the `deployment-package`
  artifacts of each repo's `Deploy to Dev Site` workflow on `main`).
- Once, in this folder: `PLAYWRIGHT_SKIP_BROWSER_GC=1 npm install` (its own lockfile, never the repo root).

## Commands (from the repo root)

```sh
node tools/wp-admin-shots/capture.mjs up                    # fetch builds, start wp-env on a free port from 8890, seed
node tools/wp-admin-shots/capture.mjs shoot stores/setup    # PNGs + static/img/2.x/stores/setup/en/wp-admin.json
node tools/wp-admin-shots/capture.mjs verify stores/setup   # sizes, pins, alt text, leak checks
node tools/wp-admin-shots/capture.mjs down                  # stop this tool's env only
```

`up` is idempotent: it reuses the ports in `.cache/state.json`, downloads a build only when `main`
moved, and the seed finds everything before creating it. `--free-dir`/`--pro-dir <dir>` use a
built plugin folder instead of the artifact.

## Adding a page

1. Add `shots/<docs path with / replaced by ->.mjs` exporting `journey` (the file prefix, e.g. `'SS'`)
   and a default array of `{ step, slug, url, prepare?, crop, pad?, padBottom?, maxHeight?, pins, alt }`.
   `url` may use `{storeId:<store name>}` or `{productId:<product name>}`.
2. Seed anything new in `seed.php` (find before create).
3. `shoot` then `verify`, open every PNG, and use the manifest in the page:
   `import m from '@site/static/img/2.x/<page>/en/wp-admin.json'` with `<JourneyShot manifest={m} device="desktop" step={N} … />`.
