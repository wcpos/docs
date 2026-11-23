#!/usr/bin/env node
// WP Admin capture tool for the docs: a local wp-env running the current woocommerce-pos and
// woocommerce-pos-pro main builds, seeded with fictional data, and cropped light-theme shots
// with a JourneyShot-compatible manifest. Usage: see README.md.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TOOL = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TOOL, '..', '..');
const CACHE = path.join(TOOL, '.cache');
const STATE_FILE = path.join(CACHE, 'state.json');
const WP_ENV = path.join(TOOL, 'node_modules', '.bin', 'wp-env');
const REPOS = { free: 'woocommerce-pos', pro: 'woocommerce-pos-pro' };
// First port probed for this tool's env; the machine's other wp-envs sit on 8888/8889 and up.
const FIRST_PORT = 8890;
// Hidden before every shot: admin notices, nags, the footer and WooCommerce's notice/tour popovers.
const HIDE_CSS = `.notice, .update-nag, .woocommerce-layout__notice-list, #wpfooter,
  .woocommerce-layout__activity-panel-popover, .woocommerce-tour-kit, .components-popover.woocommerce-tour-kit-step,
  .woocommerce-customer-effort-score, .components-snackbar-list { display: none !important; }`;
// React app roots that must have content before a shot.
const APP_ROOTS = ['#wcpos-store-edit', '#woocommerce-pos-settings'];

class Fail extends Error {}
const fail = (message) => { throw new Fail(message); };

function readState() {
  return fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : {};
}

function writeState(state) {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function wpEnvVars(state) {
  return { ...process.env, WP_ENV_PORT: String(state.port), WP_ENV_TESTS_PORT: String(state.testsPort) };
}

// Runs wp-env in this tool's folder; returns stdout. Throws with stderr's tail on failure.
function wpEnv(state, args, { quiet = true } = {}) {
  const result = spawnSync(WP_ENV, args, { cwd: TOOL, env: wpEnvVars(state), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (!quiet) process.stderr.write(result.stderr || '');
  if (result.status !== 0) {
    fail(`wp-env ${args.slice(0, 3).join(' ')} failed (exit ${result.status}):\n${(result.stderr || result.stdout || '').trim().split('\n').slice(-15).join('\n')}`);
  }
  return result.stdout;
}

const wp = (state, ...args) => wpEnv(state, ['run', 'cli', 'wp', ...args]);

// The free plugin's activation sets these (consent modal and callout) when consent is undecided.
const CONSENT_TRANSIENTS = ['wcpos_show_consent_modal', 'wcpos_consent_reach'];

// Raw JSON of an option, or undefined when wp-cli says it does not exist (any other failure throws).
function readOption(state, name) {
  try {
    const raw = wp(state, 'option', 'get', name, '--format=json').trim();
    JSON.parse(raw); // throws on anything but JSON
    return raw;
  } catch (error) {
    if (error instanceof Fail && /Could not get '.+' option/.test(error.message)) return undefined;
    throw error;
  }
}

// A shot's `site` and `settings`, applied around run() and undone in reverse (settings, then site)
// even when the shot fails. Pro bundles the free plugin and deactivates a standalone one, so
// 'free' is Pro off and woocommerce-pos on; the undo turns free off before Pro on (no clash).
async function withShotSite(state, shot, run) {
  const undo = [];
  try {
    if (shot.site === 'free') {
      const absent = CONSENT_TRANSIENTS.filter((name) => !wp(state, 'transient', 'get', name).trim());
      undo.unshift(() => {
        wp(state, 'plugin', 'deactivate', REPOS.free);
        wp(state, 'plugin', 'activate', REPOS.pro);
        wp(state, 'plugin', 'is-active', REPOS.pro); // exits 1, so fails loudly, unless Pro is active
        for (const name of absent) wp(state, 'transient', 'delete', name);
      });
      wp(state, 'plugin', 'deactivate', REPOS.pro);
      wp(state, 'plugin', 'activate', REPOS.free);
    } else if (shot.site) fail(`shot ${shot.step}: unknown site "${shot.site}" (only 'free')`);
    for (const [name, keys] of Object.entries(shot.settings || {})) {
      const before = readOption(state, name);
      undo.unshift(() => (before === undefined ? wp(state, 'option', 'delete', name) : wp(state, 'option', 'update', name, before, '--format=json')));
      wp(state, 'option', 'update', name, JSON.stringify({ ...JSON.parse(before ?? '{}'), ...keys }), '--format=json');
    }
    return await run();
  } finally {
    const errors = [];
    for (const step of undo) try { step(); } catch (error) { errors.push(error.message); }
    if (errors.length) fail(`shot ${shot.step} ${shot.slug}: could not restore the site:\n${errors.join('\n')}`);
  }
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(true));
  });
}

async function freePorts(count) {
  const ports = [];
  for (let port = FIRST_PORT; ports.length < count && port < FIRST_PORT + 200; port++) {
    if (await portIsFree(port)) ports.push(port);
  }
  if (ports.length < count) fail(`no free ports from ${FIRST_PORT}`);
  return ports;
}

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' });

// Newest main run of the repo's Deploy to Dev Site workflow that carries the deployment-package artifact.
function newestBuild(repo) {
  const runs = JSON.parse(gh('run', 'list', '-R', `wcpos/${repo}`, '-w', 'deploy-dev.yml', '-b', 'main', '-L', '10', '--json', 'databaseId,headSha,status,conclusion'));
  for (const run of runs) {
    if (run.status !== 'completed') continue;
    const names = gh('api', `repos/wcpos/${repo}/actions/runs/${run.databaseId}/artifacts`, '--jq', '.artifacts[].name').split('\n');
    if (names.includes('deployment-package')) return run;
  }
  return fail(`no completed deploy-dev run on main with a deployment-package artifact for wcpos/${repo}`);
}

// Puts a built plugin at .cache/plugins/<repo>; returns the headSha it came from.
function fetchPlugin(key, givenDir, state) {
  const repo = REPOS[key];
  const target = path.join(CACHE, 'plugins', repo);
  if (givenDir) {
    if (!fs.existsSync(path.join(givenDir, `${repo}.php`))) fail(`${givenDir} has no ${repo}.php`);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(path.resolve(givenDir), target, { recursive: true });
    return 'local';
  }
  const run = newestBuild(repo);
  if (state.shas?.[key] === run.headSha && fs.existsSync(path.join(target, `${repo}.php`))) return run.headSha;
  const download = path.join(CACHE, 'download', repo);
  fs.rmSync(download, { recursive: true, force: true });
  gh('run', 'download', String(run.databaseId), '-R', `wcpos/${repo}`, '-n', 'deployment-package', '-D', download);
  const tarball = path.join(download, `${repo}.tar.gz`);
  if (!fs.existsSync(tarball)) fail(`artifact of run ${run.databaseId} has no ${repo}.tar.gz`);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', tarball, '-C', target]);
  if (!fs.existsSync(path.join(target, `${repo}.php`))) fail(`${repo}.tar.gz has no ${repo}.php at its root`);
  return run.headSha;
}

function option(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

async function up(args) {
  const state = readState();
  if (!state.port) [state.port, state.testsPort] = await freePorts(2);
  state.shas = {
    free: fetchPlugin('free', option(args, '--free-dir'), state),
    pro: fetchPlugin('pro', option(args, '--pro-dir'), state),
  };
  state.siteUrl = `http://localhost:${state.port}`;
  writeState(state);
  // seed.php doubles as a mu-plugin. A folder is mapped, not the file: editors replace files
  // by rename, which leaves a single-file bind mount pointing at the old copy.
  fs.mkdirSync(path.join(CACHE, 'mu-plugins'), { recursive: true });
  fs.copyFileSync(path.join(TOOL, 'seed.php'), path.join(CACHE, 'mu-plugins', 'wpas-seed.php'));
  wpEnv(state, ['start']);
  const seedFile = 'wp-content/mu-plugins/wpas-seed.php';
  wp(state, 'eval-file', seedFile, 'licence');
  const seed = wp(state, 'eval-file', seedFile).split('\n').find((line) => line.startsWith('seed:')) || 'seed: no summary';
  console.log(`up: ${state.siteUrl} · woocommerce-pos ${state.shas.free} · woocommerce-pos-pro ${state.shas.pro} · ${seed}`);
}

function down() {
  const state = readState();
  if (!state.port) fail('no .cache/state.json: this tool has no env to stop');
  wpEnv(state, ['stop']);
  console.log(`down: stopped the wp-admin-shots env on port ${state.port}`);
}

const outDir = (page) => path.join(ROOT, 'static', 'img', '2.x', page, 'en');
const manifestPath = (page) => path.join(outDir(page), 'wp-admin.json');
const textPath = (file) => path.join(CACHE, 'text', `${file}.txt`);

// Replaces {storeId:<name>} and {productId:<name>} with post IDs looked up through wp-cli.
function resolveUrl(state, url) {
  return url.replace(/\{(storeId|productId):([^}]+)\}/g, (match, kind, name) => {
    const type = kind === 'storeId' ? 'wcpos_store' : 'product';
    const posts = JSON.parse(wp(state, 'post', 'list', `--post_type=${type}`, '--fields=ID,post_title', '--format=json'));
    const post = posts.find((p) => p.post_title === name);
    return post ? String(post.ID) : fail(`no ${type} titled "${name}"`);
  });
}

async function boxOf(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  return locator.boundingBox();
}

async function takeShot(page, state, shot, journey, page_) {
  const url = resolveUrl(state, shot.url);
  await page.goto(`${state.siteUrl}/${url.replace(/^\//, '')}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_CSS });
  for (const root of APP_ROOTS) {
    if (await page.locator(root).count()) await page.waitForFunction((sel) => document.querySelector(sel)?.childElementCount > 0, root);
  }
  if (shot.prepare) await shot.prepare(page);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, 0));
  const pad = shot.pad ?? 16;
  const boxes = [];
  for (const selector of shot.crop) boxes.push(await boxOf(page, selector));
  // The padding never reaches into the admin bar, nor into the admin menu unless the crop starts in it.
  const size = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight,
    barBottom: document.getElementById('wpadminbar')?.getBoundingClientRect().bottom ?? 0,
    menuRight: document.getElementById('adminmenuback')?.getBoundingClientRect().right ?? 0,
  }));
  const left = Math.min(...boxes.map((b) => b.x));
  const x = Math.max(left >= size.menuRight ? size.menuRight : 0, Math.floor(left - pad));
  const y = Math.max(size.barBottom, Math.floor(Math.min(...boxes.map((b) => b.y)) - pad));
  const right = Math.min(size.w, Math.ceil(Math.max(...boxes.map((b) => b.x + b.width)) + pad));
  const bottom = Math.min(size.h, Math.ceil(Math.max(...boxes.map((b) => b.y + b.height)) + (shot.padBottom ?? pad)));
  const clip = { x, y, width: right - x, height: Math.min(bottom - y, shot.maxHeight ?? 720) };
  const pins = [];
  for (const pin of shot.pins) {
    const b = await boxOf(page, pin.selector);
    pins.push({ testID: pin.name, box: { x: Math.round(b.x - clip.x), y: Math.round(b.y - clip.y), width: Math.round(b.width), height: Math.round(b.height) } });
  }
  const file = `desktop-light-regular--${journey.toLowerCase()}-${shot.step}-${shot.slug}.png`;
  await page.screenshot({ path: path.join(outDir(page_), file), clip, fullPage: true, animations: 'disabled' });
  const text = [];
  for (const selector of shot.crop) text.push(await page.locator(selector).first().innerText());
  fs.mkdirSync(path.dirname(textPath(file)), { recursive: true });
  fs.writeFileSync(textPath(file), text.join('\n\n'));
  return {
    file, step: shot.step, slug: shot.slug, device: 'desktop', colorScheme: 'light', scale: 'regular', store: 'wp-env', variant: shot.site === 'free' ? 'free' : 'pro',
    viewport: { width: clip.width, height: clip.height }, url: new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash,
    selector: shot.crop.join(', '), alt: shot.alt, pins,
  };
}

async function shoot(pageArg) {
  const state = readState();
  if (!state.siteUrl) fail('run `capture.mjs up` first');
  const shotFile = path.join(TOOL, 'shots', `${pageArg.replace(/\//g, '-')}.mjs`);
  if (!fs.existsSync(shotFile)) fail(`no shot file ${path.relative(ROOT, shotFile)}`);
  const { default: shots, journey } = await import(pathToFileURL(shotFile));
  if (!journey || !Array.isArray(shots)) fail(`${path.relative(ROOT, shotFile)} must export default [shots] and const journey`);
  fs.mkdirSync(outDir(pageArg), { recursive: true });
  // Remove this tool's earlier output for the page (the files its last manifest listed) only.
  if (fs.existsSync(manifestPath(pageArg))) {
    for (const c of JSON.parse(fs.readFileSync(manifestPath(pageArg), 'utf8')).captures) fs.rmSync(path.join(outDir(pageArg), c.file), { force: true });
  }
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const started = new Date();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US',
      timezoneId: 'America/Los_Angeles', reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${state.siteUrl}/wp-login.php`);
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password'); // wp-env's well-known local default, not a secret.
    // Wait for the redirect only, not the dashboard's load: WooCommerce's dashboard is slow on a busy host.
    await Promise.all([page.waitForURL(/wp-admin/, { waitUntil: 'commit', timeout: 120000 }), page.click('#wp-submit')]);
    // A shot that fails twice is reported and skipped; the others are still written, and shoot exits 1.
    const captures = [];
    const failed = [];
    for (const shot of [...shots].sort((a, b) => a.step - b.step)) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          captures.push(await withShotSite(state, shot, () => takeShot(page, state, shot, journey, pageArg)));
          break;
        } catch (error) {
          if (error instanceof Fail) throw error;
          console.error(`shot ${shot.step} ${shot.slug}: ${error.message.split('\n')[0]}${attempt === 1 ? '; reloading once' : ''}`);
          if (attempt === 2) failed.push(`${shot.step} ${shot.slug}`);
        }
      }
    }
    const stamp = started.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '');
    const sha7 = (sha) => (sha || 'unknown').slice(0, 7);
    const manifest = {
      runId: `wp-admin-${stamp}`, commit: `woocommerce-pos ${sha7(state.shas?.free)} + woocommerce-pos-pro ${sha7(state.shas?.pro)}`,
      date: started.toISOString(), journey, page: `${pageArg}/index.mdx`, locale: 'en', tool: 'tools/wp-admin-shots', captures,
    };
    fs.writeFileSync(manifestPath(pageArg), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`shoot: ${captures.length} shots + ${path.relative(ROOT, manifestPath(pageArg))}`);
    if (failed.length) fail(`shoot: not taken: ${failed.join(', ')}`);
  } finally {
    await browser.close();
  }
}

// ---- `pos`: the released WCPOS desktop app's Choose a store screen, connected to this env.
// The web build at /pos skips Connect/Choose a store, so this screen comes from the desktop app.
const APP_RELEASE = 'v2.0.6';
const APP_DEFAULT = path.join(CACHE, 'app', 'WCPOS.app');
const posManifestPath = (page) => path.join(outDir(page), 'manifest.json');
// One desktop-app shot per page. `user` signs in with the seed's throwaway local password.
const POS_SHOTS = {
  'stores/setup': {
    journey: 'ST', step: 1, slug: 'choose-store', user: 'maya', pick: 'Harbour Street', stores: ['Harbour Street', 'Market Hall'],
  },
};
const TABLET = { width: 1024, height: 768 };

function appExecutable(given) {
  const app = path.resolve(given || APP_DEFAULT);
  const exe = app.endsWith('.app') && fs.existsSync(path.join(app, 'Contents', 'MacOS'))
    ? path.join(app, 'Contents', 'MacOS', fs.readdirSync(path.join(app, 'Contents', 'MacOS'))[0] || '-')
    : app;
  if (!fs.existsSync(exe) || fs.statSync(exe).isDirectory()) {
    fail(`no WCPOS desktop app at ${app}. Fetch it: gh release download ${APP_RELEASE} -R wcpos/electron -p 'WCPOS-darwin-arm64-${APP_RELEASE.slice(1)}.zip' -D <dir>, then ditto -x -k <zip> ${path.dirname(APP_DEFAULT)} (or pass --app <path>)`);
  }
  return exe;
}

const storeIds = (state) => Object.fromEntries(
  JSON.parse(wp(state, 'post', 'list', '--post_type=wcpos_store', '--fields=ID,post_title', '--format=json')).map((p) => [p.post_title, p.ID]),
);

async function pos(pageArg, args) {
  const state = readState();
  if (!state.siteUrl) fail('run `capture.mjs up` first');
  const spec = POS_SHOTS[pageArg] || fail(`no desktop-app shot for ${pageArg} (have: ${Object.keys(POS_SHOTS).join(', ')})`);
  const executablePath = appExecutable(option(args, '--app'));
  const ids = storeIds(state);
  for (const name of spec.stores) if (!ids[name]) fail(`no store "${name}" on the env; run up`);
  // A throwaway profile, emptied every run: the app's real data in ~/Library is never touched.
  const profile = path.join(CACHE, 'pos-profile');
  fs.rmSync(profile, { recursive: true, force: true });
  fs.mkdirSync(profile, { recursive: true });
  const { _electron } = await import('playwright');
  const app = await _electron.launch({
    executablePath, args: [`--user-data-dir=${profile}`, '--lang=en-US', '--force-device-scale-factor=1'],
    env: { ...process.env, LANG: 'en_US.UTF-8' }, timeout: 60000,
  });
  const started = new Date();
  try {
    const userData = await app.evaluate(({ app: a }) => a.getPath('userData'));
    if (path.resolve(userData) !== path.resolve(profile)) fail(`the desktop app ignored --user-data-dir (userData ${userData})`);
    const version = await app.evaluate(({ app: a }) => a.getVersion());
    await app.evaluate(({ nativeTheme }) => { nativeTheme.themeSource = 'light'; });
    // The app's normalizeStoreUrl strips the scheme and always connects over https, and this env is
    // plain http. In this throwaway profile's session only, https://<env> is redirected to http://.
    const https = state.siteUrl.replace(/^http:/, 'https:');
    await app.evaluate(({ session }, [from, to]) => {
      session.defaultSession.webRequest.onBeforeRequest({ urls: [`${from}/*`] }, (d, cb) => cb({ redirectURL: to + d.url.slice(from.length) }));
    }, [https, state.siteUrl]);
    const page = await app.firstWindow();
    await app.evaluate(({ BrowserWindow }, [w, h]) => {
      const win = BrowserWindow.getAllWindows().find((b) => !b.isDestroyed() && b.isVisible()) ?? BrowserWindow.getAllWindows()[0];
      win.setContentSize(w, h);
    }, [TABLET.width, TABLET.height]);
    const byId = (id) => page.getByTestId(id).filter({ visible: true }).first();
    await byId('store-url-input').waitFor({ state: 'visible', timeout: 90000 });
    await byId('store-url-input').fill(state.siteUrl);
    await byId('connect-store-button').click();
    await byId('add-user-button').waitFor({ state: 'visible', timeout: 60000 });
    // Sign in through the app's own auth window (the plugin's /wcpos-auth/ form).
    const authWindow = app.waitForEvent('window', { timeout: 60000 });
    await byId('add-user-button').click();
    const auth = await authWindow;
    await auth.locator('#wcpos-user-login').waitFor({ state: 'visible', timeout: 60000 });
    await auth.locator('#wcpos-user-login').fill(spec.user);
    await auth.locator('#wcpos-user-pass').fill('password'); // the seed's local throwaway, like wp-env's admin/password
    await auth.locator('#wcpos-submit').click();
    await auth.waitForEvent('close', { timeout: 120000 }).catch(() => {});
    await byId('wp-user-row').waitFor({ state: 'visible', timeout: 60000 });
    for (const name of spec.stores) await byId(`store-option-${ids[name]}`).waitFor({ state: 'visible', timeout: 60000 });
    await byId(`store-option-${ids[spec.pick]}`).click();
    await page.mouse.move(1, 1); // park the pointer where nothing reacts to hover
    // Three stores make the screen taller than the window (the app's title bar then overlays the top
    // of the logo): start from the top, scroll only as far as Open POS needs, no scrollbar track.
    await page.addStyleTag({ content: '* { scrollbar-width: none !important; }' });
    await page.evaluate(() => { for (const el of document.querySelectorAll('*')) if (el.scrollTop) el.scrollTop = 0; });
    await byId('open-pos-button').evaluate((el) => el.scrollIntoView({ block: 'nearest' }));
    await page.waitForTimeout(1000);
    const size =await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
    if (size.width !== TABLET.width || size.height !== TABLET.height) fail(`app window is ${size.width}x${size.height}, not ${TABLET.width}x${TABLET.height}`);
    const pins = [];
    for (const testID of [...spec.stores.map((name) => `store-option-${ids[name]}`), 'open-pos-button']) {
      const b = await byId(testID).boundingBox();
      if (!b) fail(`pin ${testID} not visible`);
      pins.push({ testID, box: { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) } });
    }
    const file = `tablet-light-regular--${spec.journey.toLowerCase()}-${spec.step}-${spec.slug}.png`;
    fs.mkdirSync(outDir(pageArg), { recursive: true });
    await page.screenshot({ path: path.join(outDir(pageArg), file), animations: 'disabled', caret: 'hide' });
    fs.mkdirSync(path.dirname(textPath(file)), { recursive: true });
    fs.writeFileSync(textPath(file), await page.locator('body').innerText());
    const manifest = {
      runId: `pos-${started.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, '')}`, commit: version, date: started.toISOString(),
      journey: spec.journey, page: `${pageArg}/index.mdx`, locale: 'en', tool: 'tools/wp-admin-shots',
      captures: [{
        file, step: spec.step, slug: spec.slug, device: 'tablet', colorScheme: 'light', scale: 'regular', store: 'wp-env', variant: 'pro',
        viewport: TABLET, pins,
      }],
    };
    fs.writeFileSync(posManifestPath(pageArg), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`pos: ${path.relative(ROOT, path.join(outDir(pageArg), file))} (WCPOS ${version}, ${spec.user})`);
    console.log(`pos: ${path.relative(ROOT, posManifestPath(pageArg))}`);
  } catch (error) {
    const shot = path.join(CACHE, 'pos-failure.png');
    for (const w of app.windows()) await w.screenshot({ path: shot.replace('.png', `-${app.windows().indexOf(w)}.png`) }).catch(() => {});
    console.error(`pos: failed; window screenshots in ${path.relative(ROOT, CACHE)}/pos-failure-*.png`);
    throw error;
  } finally {
    await app.close().catch(() => {});
  }
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function verify(pageArg) {
  if (!fs.existsSync(manifestPath(pageArg))) fail(`no ${path.relative(ROOT, manifestPath(pageArg))}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath(pageArg), 'utf8'));
  const failures = [];
  const listed = new Set();
  const steps = new Set(manifest.captures.map((c) => c.step));
  const shotFile = path.join(TOOL, 'shots', `${pageArg.replace(/\//g, '-')}.mjs`);
  if (fs.existsSync(shotFile)) {
    for (const shot of (await import(pathToFileURL(shotFile))).default) {
      if (!steps.has(shot.step)) failures.push(`step ${shot.step} ${shot.slug}: not in the manifest`);
    }
  }
  for (const c of manifest.captures) {
    listed.add(c.file);
    checkCapture(pageArg, c, failures, { alt: true, run: 'shoot' });
  }
  const prefix = `desktop-light-regular--${manifest.journey.toLowerCase()}-`;
  for (const file of fs.readdirSync(outDir(pageArg))) {
    if (file.startsWith(prefix) && !listed.has(file)) failures.push(`${file}: not in wp-admin.json`);
  }
  let count = manifest.captures.length;
  if (POS_SHOTS[pageArg]) {
    if (!fs.existsSync(posManifestPath(pageArg))) failures.push(`no ${path.relative(ROOT, posManifestPath(pageArg))} (run pos)`);
    else {
      for (const c of JSON.parse(fs.readFileSync(posManifestPath(pageArg), 'utf8')).captures) {
        count += 1;
        if (c.viewport.width !== TABLET.width || c.viewport.height !== TABLET.height) failures.push(`${c.file}: viewport is not ${TABLET.width}x${TABLET.height}`);
        checkCapture(pageArg, c, failures, { alt: false, run: 'pos', site: readState().siteUrl });
      }
    }
  }
  if (failures.length) fail(`verify: ${failures.length} failure(s)\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  console.log(`verify: ${count} shots OK for ${pageArg}`);
}

// Size, pins inside the image, and leak checks on the text the shot was taken from.
function checkCapture(pageArg, c, failures, { alt, run, site }) {
  const file = path.join(outDir(pageArg), c.file);
  if (!fs.existsSync(file)) { failures.push(`${c.file}: missing`); return; }
  const size = pngSize(file);
  if (!size || size.width !== c.viewport.width || size.height !== c.viewport.height) {
    failures.push(`${c.file}: PNG is ${size ? `${size.width}x${size.height}` : 'unreadable'}, viewport says ${c.viewport.width}x${c.viewport.height}`);
  }
  if (alt && (!c.alt || !c.alt.trim())) failures.push(`${c.file}: empty alt`);
  for (const { testID, box } of c.pins) {
    if (box.x < 0 || box.y < 0 || box.x + box.width > c.viewport.width || box.y + box.height > c.viewport.height) failures.push(`${c.file}: pin ${testID} outside the viewport`);
  }
  if (!fs.existsSync(textPath(c.file))) { failures.push(`${c.file}: no text dump in .cache/text (run ${run})`); return; }
  // The desktop app's site card shows the connected env's own address; nothing else local may show.
  const raw = fs.readFileSync(textPath(c.file), 'utf8');
  const text = site ? raw.split(site).join('') : raw;
  for (const [, domain] of text.matchAll(/[\w.%+-]+@([\w-]+(?:\.[\w-]+)+)/g)) {
    if (!['example.com', 'example.org'].includes(domain.toLowerCase())) failures.push(`${c.file}: address @${domain} in text`);
  }
  if (/WCPOS-DOCS/i.test(text)) failures.push(`${c.file}: licence key in text`);
  if (/localhost|127\.0\.0\.1/i.test(text)) failures.push(`${c.file}: local URL in text`);
}

const [command, ...rest] = process.argv.slice(2);
const commands = { up: () => up(rest), down, shoot: () => shoot(rest[0] || fail('shoot needs a page, e.g. stores/setup')), verify: () => verify(rest[0] || fail('verify needs a page')), pos: () => pos(rest[0] || fail('pos needs a page, e.g. stores/setup'), rest) };
try {
  if (!commands[command]) fail('usage: capture.mjs up [--free-dir DIR] [--pro-dir DIR] | shoot <page> | pos <page> [--app PATH] | verify <page> | down');
  await commands[command]();
} catch (error) {
  console.error(error instanceof Fail ? error.message : error.stack);
  process.exit(1);
}
