/** Static guarantees about the CI/CD files: no identity activation in any workflow, docs never deploy, the probe runs off-host. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const workflows = fs.readdirSync(new URL('../.github/workflows/', import.meta.url)).filter((f) => f.endsWith('.yml'));

test('no workflow sets an identity or EPG activation flag', () => {
  for (const f of workflows) assert.doesNotMatch(read(`.github/workflows/${f}`), /CONTENT_(ENTIT|IDENTITY)|EPG_YEAR_PROVENANCE/, f);
});

test('deploy.yml (builds on the VPS) is manual only and shares the deploy lock; the server script still skips documentation-only diffs', () => {
  const yml = read('.github/workflows/deploy.yml');
  assert.match(yml, /on:\s*\n\s+workflow_dispatch:\s*\n/);
  assert.doesNotMatch(yml, /^\s+(push|pull_request|schedule|workflow_run):/m, 'nothing may start the on-host build implicitly');
  assert.match(yml, /concurrency:\s*\n\s+group: deploy-prod\s*\n\s+cancel-in-progress: false/);
  const regex = /DOCS_ONLY_REGEX='([^']+)'/.exec(read('deploy-guiatv.sh'))[1];
  const re = new RegExp(regex);
  for (const path of ['docs/seo/x.md', 'README.md', 'graphify-out/graph.json', 'tasks/a', 'scripts/uptime-probe.mjs', '.github/workflows/uptime.yml']) assert.ok(re.test(path), `${path} is documentation-only`);
  for (const path of ['apps/backend/src/a.ts', 'apps/frontend/src/a.ts', 'scripts/post-boot-check.mjs', 'scripts/guiatv-ops.sh', 'deploy-guiatv.sh', 'package-lock.json', 'scripts/publish-release.mjs', '.github/workflows/deploy.yml']) assert.ok(!re.test(path), `${path} changes what runs`);
});

test('3E: no workflow turns on the legacy-enrichment flag', () => {
  for (const f of workflows) assert.doesNotMatch(read(`.github/workflows/${f}`), /CONTENT_LEGACY_ENRICHMENT/, f);
});

test('the uptime probe is off-host, read-only and scheduled; the artifact deploy is manual only', () => {
  const uptime = read('.github/workflows/uptime.yml');
  assert.match(uptime, /schedule:\s*\n\s+- cron:/);
  assert.match(uptime, /permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(uptime, /ssh|scp|secrets\.DEPLOY/i);
  const artifact = read('.github/workflows/deploy-artifact.yml');
  assert.match(artifact, /on:\s*\n\s+workflow_dispatch:\s*\n/);
  assert.doesNotMatch(artifact, /^\s+push:/m);
  assert.match(artifact, /group: deploy-prod/);
});

test('3D: outage visibility needs no webhook: the run summary and one self-closing issue, with write access limited to issues', () => {
  const uptime = read('.github/workflows/uptime.yml');
  const [probe, report] = uptime.split(/\n  report:\n/);
  assert.ok(report, 'a report job exists');
  assert.doesNotMatch(probe, /issues:\s*write/, 'the probe job itself stays read-only');
  assert.match(report, /permissions:\s*\n\s+contents: read\s*\n\s+issues: write/);
  assert.match(report, /needs: probe/);
  assert.match(report, /gh issue close/);
  assert.doesNotMatch(report, /secrets\.|ssh|checkout/, 'it touches issues only');
  assert.match(read('scripts/uptime-probe.mjs'), /GITHUB_STEP_SUMMARY/);
});

test('actions are pinned to a version', () => {
  for (const f of workflows) for (const m of read(`.github/workflows/${f}`).matchAll(/uses:\s*(\S+)/g)) assert.match(m[1], /@v?\d/, `${f}: ${m[1]}`);
});
