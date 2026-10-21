#!/usr/bin/env node
/**
 * Runs once after the host boots (infra/systemd/guiatv-post-boot.service) and on demand. Read-only
 * apart from GETs to the local services and its own report files; it never restarts anything, never
 * reboots, never touches a database or an environment file.
 *
 *   node scripts/post-boot-check.mjs [--warm] [--wait 300]
 *
 * 1. waits for the API and SSR to answer (a cold MongoDB/SSR cache is slow, not down);
 * 2. records whether the PREVIOUS boot ended without a shutdown sequence (the 2026-10-20/21 signature:
 *    no OOM, no panic, no shutdown). It reports the fact, never a cause;
 * 3. checks units, the live release, and that no identity/EPG activation flag is set that nobody approved
 *    (names only; values are never read into the report);
 * 4. with --warm, renders the hub pages once, one at a time, so the first crawler gets the cache.
 * Output: /var/log/guiatv/post-boot.json (latest) and /var/log/guiatv/health-alerts.log on a problem.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const APP_DIR = process.env.APP_DIR || '/var/www/guiatv';
const API = process.env.GUIATV_API_BASE || 'http://127.0.0.1:4000';
const SSR = process.env.GUIATV_SSR_BASE || 'http://127.0.0.1:3000';
const REPORT = process.env.GUIATV_POST_BOOT_REPORT || '/var/log/guiatv/post-boot.json';
const ALERT_LOG = process.env.GUIATV_ALERT_LOG || '/var/log/guiatv/health-alerts.log';
const ENV_FILES = (process.env.GUIATV_ENV_FILES || '/etc/guiatv/api.env,/etc/guiatv/ssr.env').split(',');
const UNITS = ['guiatv-api', 'guiatv-ssr', 'mongod', 'valkey', 'nginx'];
export const HUBS = ['/', '/canales', '/plataformas', '/programacion-tv/peliculas', '/programacion-tv/series', '/programacion-tv/que-ver-hoy', '/programacion-tv/en-directo', '/guias', '/deportes/futbol', '/tendencias'];

/** Names of activation flags set in env files (names only; a value never leaves this function). */
export function flagNames(envText) {
  return [...new Set(envText.split('\n').map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/.exec(l)?.[1]).filter((n) => n && /^(CONTENT_|EPG_YEAR_PROVENANCE$)/.test(n) && n !== 'CONTENT_OWNER_PUBLIC_KEY_FILE'))].sort();
}

/** Flags present that nobody approved (`expected` is the comma-separated GUIATV_EXPECTED_FLAGS). */
export const unexpectedFlags = (present, expected = '') => present.filter((n) => !expected.split(',').map((x) => x.trim()).filter(Boolean).includes(n));

/**
 * Did the previous boot's journal end without any shutdown sequence? A clean stop always logs one of
 * these; an abrupt end (power, hypervisor) logs nothing. A statement of fact, not of cause.
 */
export const endedWithoutShutdown = (tail) => tail.trim().length > 0 && !/Reached target (Shutdown|Power-Off|Reboot|System Shutdown)|Journal stopped|systemd-shutdown|Shutting down|Stopped target Multi-User/i.test(tail);

async function get(url, timeout = 30_000, headers = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeout), headers });
    return { status: res.status, body: await res.text(), ms: Date.now() - started };
  } catch (error) {
    return { status: 0, body: '', ms: Date.now() - started, error: error?.name };
  }
}

const sh = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

export async function run({ warm = false, waitSeconds = 300 } = {}) {
  const problems = [];
  const report = { at: new Date().toISOString(), host: sh('hostname'), bootId: sh('cat', ['/proc/sys/kernel/random/boot_id']), uptimeSeconds: Number(readFileSafe('/proc/uptime').split(' ')[0]) || null };

  // 1. wait for the services
  const deadline = Date.now() + waitSeconds * 1000;
  let apiUp = false, ssrUp = false;
  while (Date.now() < deadline && !(apiUp && ssrUp)) {
    apiUp = apiUp || (await get(`${API}/v2/health`, 5000)).status === 200;
    ssrUp = ssrUp || (await get(`${SSR}/`, 20_000)).status === 200;
    if (!(apiUp && ssrUp)) await new Promise((r) => setTimeout(r, 5000));
  }
  report.servicesAnsweredAfterSeconds = Math.round((Date.now() - (deadline - waitSeconds * 1000)) / 1000);
  if (!apiUp) problems.push('API did not answer /v2/health');
  if (!ssrUp) problems.push('SSR did not answer /');

  // 2. previous boot
  const previous = sh('journalctl', ['-b', '-1', '-n', '60', '--no-pager', '-q']);
  report.previousBoot = previous ? { endedWithoutShutdown: endedWithoutShutdown(previous), note: 'a fact about the journal, not a cause' } : { known: false };
  if (report.previousBoot.endedWithoutShutdown) problems.push('previous boot ended without a shutdown sequence (cause not established)');

  // 3. units, release, flags
  report.units = Object.fromEntries(UNITS.map((u) => [u, sh('systemctl', ['is-active', u]) || 'unknown']));
  for (const [u, state] of Object.entries(report.units)) if (state !== 'active') problems.push(`${u} is ${state}`);
  try {
    report.release = { current: readlinkSync(`${APP_DIR}/current`), gitSha: JSON.parse(readFileSync(`${APP_DIR}/current/release.json`, 'utf8')).gitSha ?? null };
  } catch { problems.push('cannot read the live release'); }
  const present = ENV_FILES.flatMap((f) => (existsSync(f) ? flagNames(readFileSync(f, 'utf8')) : []));
  report.activationFlagsPresent = [...new Set(present)].sort();
  const stray = unexpectedFlags(report.activationFlagsPresent, process.env.GUIATV_EXPECTED_FLAGS);
  if (stray.length) problems.push(`activation flag(s) set that are not on the approved list: ${stray.join(', ')}`);
  // Public entity reads must be off unless the owner listed their master switch as approved.
  if (!(process.env.GUIATV_EXPECTED_FLAGS || '').split(',').map((x) => x.trim()).includes('CONTENT_ENTITY_PUBLIC_READ_ENABLED')) {
    const entity = await get(`${API}/v2/entities/resolve?path=/peliculas/post-boot-check`, 10_000);
    report.entityReads = entity.body.includes('ENTITY_PUBLIC_READ_DISABLED') ? 'off' : `unexpected ${entity.status}`;
    if (report.entityReads !== 'off') problems.push(`public entity read is not off (${entity.status})`);
  }

  // 4. cold-cache warm-up, sequential
  if (warm && ssrUp) {
    report.warm = [];
    for (const path of HUBS) {
      const r = await get(`${SSR}${path}`, 25_000, { Host: 'guiaprogramaciontv.com', 'X-Forwarded-Proto': 'https' });
      report.warm.push({ path, status: r.status, ms: r.ms });
    }
    const cold = report.warm.filter((w) => w.status !== 200);
    if (cold.length) problems.push(`${cold.length} hub page(s) did not render 200 during the warm-up`);
  }

  report.ok = problems.length === 0;
  report.problems = problems;
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n');
  if (problems.length) {
    mkdirSync(dirname(ALERT_LOG), { recursive: true });
    appendFileSync(ALERT_LOG, `[${report.at}] POST-BOOT: ${problems.join(' | ')}\n`);
  }
  return report;
}

function readFileSafe(file) { try { return readFileSync(file, 'utf8'); } catch { return ''; } }

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
  const report = await run({ warm: process.argv.includes('--warm'), waitSeconds: Number(arg('--wait', 300)) });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
