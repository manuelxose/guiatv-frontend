#!/usr/bin/env node
/**
 * GuiaTV production health watchdog.
 *
 * Why this exists: on 2026-08-12 the EPG sync job silently OOM-crash-looped
 * for weeks (systemd `Restart=always` self-healed every ~6h, hiding it from
 * casual log checks) and the host itself was fully down for 2 days —
 * neither was noticed until a manual audit. This script closes that blind
 * spot: it's meant to run on a short interval (systemd timer, see
 * guiatv-health-watchdog.timer) and surface anything that would otherwise
 * self-heal silently.
 *
 * Checks:
 *  1. Both guiatv-api / guiatv-ssr systemd units are `active`.
 *  2. No OOM/core-dump events for either unit in the lookback window.
 *  3. EPG data for *today* (Europe/Madrid) is actually non-empty via the
 *     real `/v2/tv/read` endpoint — this is what would have caught the
 *     August incident immediately instead of a month later.
 *
 * Output: any failure is written to ALERT_LOG (default
 * /var/log/guiatv/health-alerts.log) with a timestamp, and echoed to
 * stderr so it lands in `journalctl -u guiatv-health-watchdog` when run
 * via systemd. If GUIATV_ALERT_WEBHOOK_URL is set (e.g. a Slack/Discord
 * incoming webhook — not configured by this script, add it to
 * /etc/guiatv/api.env yourself when you have one), a JSON payload is
 * POSTed there too; if unset, webhook delivery is a no-op, not a failure.
 * A heartbeat file (HEARTBEAT_FILE) is updated on every successful run —
 * if that file's mtime is stale, the watchdog itself (or the host) is down.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import http from 'node:http';
import https from 'node:https';

const ALERT_LOG = process.env.GUIATV_ALERT_LOG || '/var/log/guiatv/health-alerts.log';
const HEARTBEAT_FILE = process.env.GUIATV_HEARTBEAT_FILE || '/var/log/guiatv/health-heartbeat.json';
const WEBHOOK_URL = process.env.GUIATV_ALERT_WEBHOOK_URL || '';
// Includes mongod and valkey-server: on 2026-08-13, mongod was OOM-killed
// and had no systemd Restart= directive at all (unlike the app units),
// so it stayed down silently for ~3 minutes — guiatv-api crash-looped on
// ECONNREFUSED the whole time, but this watchdog only checked the app
// units themselves, not their dependencies, so the real root cause
// wasn't flagged. A Restart=on-failure drop-in now exists for mongod
// too (/etc/systemd/system/mongod.service.d/override.conf), but this
// check stays as a second layer in case that ever fails to recover it.
const UNITS = ['guiatv-api', 'guiatv-ssr', 'mongod', 'valkey'];
const OOM_LOOKBACK = process.env.GUIATV_OOM_LOOKBACK || '-30 minutes';
const API_BASE = process.env.GUIATV_API_BASE || 'http://127.0.0.1:4000';

const problems = [];

function todayMadridYYYYMMDD() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}${get('month')}${get('day')}`;
}

function checkUnitActive(unit) {
  try {
    const out = execFileSync('systemctl', ['is-active', unit], { encoding: 'utf8' }).trim();
    if (out !== 'active') problems.push(`${unit} is not active (state: ${out})`);
  } catch (err) {
    problems.push(`${unit} is not active (systemctl exited non-zero: ${err.message})`);
  }
}

function checkNoRecentOom(unit) {
  try {
    const out = execFileSync(
      'journalctl',
      ['-u', unit, '--since', OOM_LOOKBACK, '--no-pager', '-q'],
      { encoding: 'utf8' }
    );
    // Node's own OOM signature plus the kernel OOM-killer's (mongod has no
    // Node heap limit to report - it just gets SIGKILLed by the kernel and
    // systemd logs "killed by the OOM killer" / "Failed with result 'oom-kill'").
    if (/heap out of memory|core-dump|FATAL ERROR|killed by the oom killer|result 'oom-kill'/i.test(out)) {
      problems.push(`${unit} had an OOM/core-dump event within ${OOM_LOOKBACK}`);
    }
  } catch {
    // journalctl failing to run isn't itself a product incident; don't
    // let a missing journalctl binary mask real problems.
  }
}

function fetchJson(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`invalid JSON from ${url}: ${e.message}`));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error(`timeout fetching ${url}`)));
    req.on('error', reject);
  });
}

async function checkEpgFreshness() {
  const date = todayMadridYYYYMMDD();
  try {
    const body = await fetchJson(`${API_BASE}/v2/tv/read?date=${date}&limit=1`);
    const items = body?.data?.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      problems.push(`EPG data for today (${date}) is empty at /v2/tv/read — sync may be failing again`);
    }
  } catch (err) {
    problems.push(`Could not verify EPG freshness for ${date}: ${err.message}`);
  }
}

function postWebhook(text) {
  if (!WEBHOOK_URL) return;
  try {
    const client = WEBHOOK_URL.startsWith('https') ? https : http;
    const payload = JSON.stringify({ text });
    const req = client.request(
      WEBHOOK_URL,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
      () => {}
    );
    req.on('error', () => {}); // best-effort, never let alerting itself crash the watchdog
    req.write(payload);
    req.end();
  } catch {
    // best-effort
  }
}

async function main() {
  for (const unit of UNITS) {
    checkUnitActive(unit);
    checkNoRecentOom(unit);
  }
  await checkEpgFreshness();

  mkdirSync(dirname(ALERT_LOG), { recursive: true });

  if (problems.length > 0) {
    const line = `[${new Date().toISOString()}] ALERT: ${problems.join(' | ')}\n`;
    appendFileSync(ALERT_LOG, line);
    process.stderr.write(line);
    postWebhook(`GuiaTV health watchdog: ${problems.join(' | ')}`);
    process.exitCode = 1;
  } else {
    mkdirSync(dirname(HEARTBEAT_FILE), { recursive: true });
    writeFileSync(
      HEARTBEAT_FILE,
      JSON.stringify({ lastOkAt: new Date().toISOString() }, null, 2)
    );
  }
}

main().catch((err) => {
  const line = `[${new Date().toISOString()}] ALERT: watchdog itself failed: ${err.message}\n`;
  try {
    mkdirSync(dirname(ALERT_LOG), { recursive: true });
    appendFileSync(ALERT_LOG, line);
  } catch {
    // ignore
  }
  process.stderr.write(line);
  process.exitCode = 1;
});
