/** Failure-propagation contract of scripts/deploy-ssh.sh with a fake ssh (never touches a real host). Lock/smoke paths: test-deploy-script.sh §8. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = new URL('./deploy-ssh.sh', import.meta.url).pathname;
const SHA = 'a'.repeat(40);
const SUM = 'b'.repeat(64);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-ssh-'));
// fake ssh: MODE=connect fails like an unreachable host; otherwise runs the remote script locally with a stub `sudo`
fs.writeFileSync(path.join(dir, 'ssh'), `#!/bin/bash
[ "$FAKE_MODE" = connect ] && { echo "ssh: connect to host: Connection refused" >&2; exit 255; }
[ "$FAKE_MODE" = hang ] && exec sleep 30
while [ "$1" != bash ]; do shift; done
exec env PATH="${dir}:$PATH" "$@"
`, { mode: 0o755 });
fs.writeFileSync(path.join(dir, 'sudo'), `#!/bin/bash
echo "$@" >>"${dir}/sudo.log"
[ "$FAKE_MODE" = fail3 ] && exit 3
[ "$FAKE_MODE" = lock ] && exit 75
exit 0
`, { mode: 0o755 });

const run = (mode, args = [SHA, SUM], extra = {}) => {
  fs.rmSync(path.join(dir, 'sudo.log'), { force: true });
  return spawnSync('bash', [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, SSH_BIN: path.join(dir, 'ssh'), FAKE_MODE: mode, DEPLOY_SSH_HOST: 'h', DEPLOY_SSH_USER: 'u', DEPLOY_SSH_KEY: 'not-a-key', ...extra },
  });
};

test('successful remote command exits 0 and passes sha + checksum to the deploy script', () => {
  const r = run('ok');
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(path.join(dir, 'sudo.log'), 'utf8'), new RegExp(`deploy-guiatv.sh main /var/tmp/guiatv-${SHA}/guiatv-artifact.tgz ${SUM}`));
});

test('remote command exiting nonzero fails the step with that status, even though the cleanup line runs after it', () => {
  const r = run('fail3');
  assert.equal(r.status, 3);
  assert.match(r.stderr, /Remote deploy FAILED \(exit 3\)/);
});

test('deployment lock contention (75) propagates', () => assert.equal(run('lock').status, 75));

test('ssh connection failure fails the step', () => assert.equal(run('connect').status, 255));

test('a hung deploy is killed by the timeout (124)', () => assert.equal(run('hang', [SHA, SUM], { DEPLOY_TIMEOUT: '1' }).status, 124));

test('malformed arguments are refused before any ssh', () => {
  assert.equal(run('ok', ['x; rm -rf /', SUM]).status, 2);
  assert.equal(run('ok', [SHA, 'nope']).status, 2);
});

test('the key is never echoed', () => {
  const r = run('fail3', [SHA, SUM], { DEPLOY_SSH_KEY: 'SECRET-KEY-MATERIAL' });
  assert.doesNotMatch(r.stdout + r.stderr, /SECRET-KEY-MATERIAL/);
});
