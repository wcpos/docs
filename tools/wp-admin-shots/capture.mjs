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
    file, step: shot.step, slug: shot.slug, device: 'desktop', colorScheme: 'light', scale: 'regular', store: 'wp-env', variant: 'pro',
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
          captures.push(await takeShot(page, state, shot, journey, pageArg));
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
    const file = path.join(outDir(pageArg), c.file);
    if (!fs.existsSync(file)) { failures.push(`${c.file}: missing`); continue; }
    const size = pngSize(file);
    if (!size || size.width !== c.viewport.width || size.height !== c.viewport.height) {
      failures.push(`${c.file}: PNG is ${size ? `${size.width}x${size.height}` : 'unreadable'}, viewport says ${c.viewport.width}x${c.viewport.height}`);
    }
    if (!c.alt || !c.alt.trim()) failures.push(`${c.file}: empty alt`);
    for (const { testID, box } of c.pins) {
      if (box.x < 0 || box.y < 0 || box.x + box.width > c.viewport.width || box.y + box.height > c.viewport.height) failures.push(`${c.file}: pin ${testID} outside the viewport`);
    }
    if (!fs.existsSync(textPath(c.file))) { failures.push(`${c.file}: no text dump in .cache/text (run shoot)`); continue; }
    const text = fs.readFileSync(textPath(c.file), 'utf8');
    for (const [, domain] of text.matchAll(/[\w.%+-]+@([\w-]+(?:\.[\w-]+)+)/g)) {
      if (!['example.com', 'example.org'].includes(domain.toLowerCase())) failures.push(`${c.file}: address @${domain} in text`);
    }
    if (/WCPOS-DOCS/i.test(text)) failures.push(`${c.file}: licence key in text`);
    if (/localhost|127\.0\.0\.1/i.test(text)) failures.push(`${c.file}: local URL in text`);
  }
  const prefix = `desktop-light-regular--${manifest.journey.toLowerCase()}-`;
  for (const file of fs.readdirSync(outDir(pageArg))) {
    if (file.startsWith(prefix) && !listed.has(file)) failures.push(`${file}: not in wp-admin.json`);
  }
  if (failures.length) fail(`verify: ${failures.length} failure(s)\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  console.log(`verify: ${manifest.captures.length} shots OK for ${pageArg}`);
}

const [command, ...rest] = process.argv.slice(2);
const commands = { up: () => up(rest), down, shoot: () => shoot(rest[0] || fail('shoot needs a page, e.g. stores/setup')), verify: () => verify(rest[0] || fail('verify needs a page')) };
try {
  if (!commands[command]) fail('usage: capture.mjs up [--free-dir DIR] [--pro-dir DIR] | shoot <page> | verify <page> | down');
  await commands[command]();
} catch (error) {
  console.error(error instanceof Fail ? error.message : error.stack);
  process.exit(1);
}
