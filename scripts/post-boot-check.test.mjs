import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPreviousBoot, endedWithoutShutdown, flagNames, HUBS, unexpectedFlags } from './post-boot-check.mjs';

test('flag names: only identity/EPG activation flags, names only, comments and values ignored', () => {
  const env = ['PORT=4000', 'CONTENT_ENTITIES_ENABLED=true', '# CONTENT_IDENTITY_WRITES=guiatv', 'export CONTENT_ENTITY_PUBLIC_READ_SCOPE=canary', 'EPG_YEAR_PROVENANCE=1', 'EPG_YEAR_PROVENANCE_EXTRA=1', 'SECRET_TOKEN=abc'].join('\n');
  assert.deepEqual(flagNames(env), ['CONTENT_ENTITIES_ENABLED', 'CONTENT_ENTITY_PUBLIC_READ_SCOPE', 'EPG_YEAR_PROVENANCE']);
  assert.deepEqual(flagNames('CONTENT_OWNER_PUBLIC_KEY_FILE=/etc/guiatv/owner-public.pem'), [], 'the public key is configuration, not an activation flag');
  assert.ok(!JSON.stringify(flagNames(env)).includes('abc') && !JSON.stringify(flagNames(env)).includes('canary'), 'values never appear');
  assert.deepEqual(flagNames('PORT=1\nMONGODB_URI=mongodb://x'), []);
});

test('unexpected flags: anything not on the approved list', () => {
  assert.deepEqual(unexpectedFlags(['CONTENT_ENTITIES_ENABLED']), ['CONTENT_ENTITIES_ENABLED']);
  assert.deepEqual(unexpectedFlags(['CONTENT_ENTITIES_ENABLED', 'EPG_YEAR_PROVENANCE'], 'EPG_YEAR_PROVENANCE, X'), ['CONTENT_ENTITIES_ENABLED']);
  assert.deepEqual(unexpectedFlags([], ''), []);
});

test('previous boot: an abrupt end is a fact, a normal shutdown is not, an empty journal says nothing', () => {
  const abrupt = 'Oct 21 18:58:47 vps guiatv-api[1]: GET /v2/tv/read 200\nOct 21 18:58:47 vps valkey[2]: 100 changes in 300 seconds. Saving...';
  const clean = 'Oct 21 18:58:40 vps systemd[1]: Reached target Shutdown.\nOct 21 18:58:41 vps systemd-journald[1]: Journal stopped';
  assert.equal(endedWithoutShutdown(abrupt), true);
  assert.equal(endedWithoutShutdown(clean), false);
  assert.equal(endedWithoutShutdown(''), false);
});

test('previous boot classification: per-user shutdown target is not a system shutdown; kernel OOM/panic and missing evidence are distinct', () => {
  const user = 'Oct 21 20:58:40 vps systemd[96133]: Reached target shutdown.target - Shutdown.\nOct 21 20:58:47 vps valkey-server[746]: Saving...';
  const restart = 'Oct 21 19:08:17 vps systemd[1]: guiatv-api.service: Failed with result \'exit-code\'.\nOct 21 19:08:17 vps systemd[1]: Started guiatv-api.service';
  const poweroff = 'Oct 20 17:24:30 vps systemd[1]: Reached target poweroff.target - System Power Off.\nOct 20 17:24:30 vps systemd-shutdown[1]: Syncing filesystems';
  assert.equal(classifyPreviousBoot(user).kind, 'abrupt-end');
  assert.equal(classifyPreviousBoot(restart).kind, 'abrupt-end', 'a service restart is not a shutdown');
  assert.equal(classifyPreviousBoot(poweroff).kind, 'clean-shutdown');
  assert.equal(classifyPreviousBoot(user, 'kernel: Out of memory: Killed process 12 (node)').kind, 'kernel-oom');
  assert.equal(classifyPreviousBoot(user, 'kernel: Kernel panic - not syncing').kind, 'kernel-panic');
  assert.equal(classifyPreviousBoot('  ').kind, 'insufficient-evidence');
});

test('the warm-up list is the deploy script\'s, so the two never drift', async () => {
  const { readFileSync } = await import('node:fs');
  const deploy = readFileSync(new URL('../deploy-guiatv.sh', import.meta.url), 'utf8');
  const ops = readFileSync(new URL('./guiatv-ops.sh', import.meta.url), 'utf8');
  for (const path of HUBS) assert.ok(ops.includes(` ${path} `) || ops.includes(` ${path}\n`) || ops.includes(`${path} \\`) || ops.includes(` ${path};`), `ops: ${path}`);
  for (const path of HUBS) assert.ok(deploy.includes(` ${path} `) || deploy.includes(` ${path}\n`) || deploy.includes(`${path} \\`) || deploy.includes(` ${path};`), path);
});
