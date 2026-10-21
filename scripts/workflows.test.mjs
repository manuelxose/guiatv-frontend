/** Static guarantees about the CI/CD files: no identity activation in any workflow, docs never deploy, the probe runs off-host. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const workflows = fs.readdirSync(new URL('../.github/workflows/', import.meta.url)).filter((f) => f.endsWith('.yml'));

test('no workflow sets an identity or EPG activation flag', () => {
  for (const f of workflows) assert.doesNotMatch(read(`.github/workflows/${f}`), /CONTENT_(ENTIT|IDENTITY)|EPG_YEAR_PROVENANCE/, f);
});

test('deploy.yml does not run for documentation-only pushes; its ignore list matches the server script\'s', () => {
  const yml = read('.github/workflows/deploy.yml');
  const ignored = [...yml.matchAll(/^\s+- '([^']+)'$/gm)].map((m) => m[1]);
  for (const p of ['docs/**', '**/*.md', 'graphify-out/**', 'tasks/**', 'design/**']) assert.ok(ignored.includes(p), p);
  assert.match(yml, /concurrency:\s*\n\s+group: deploy-prod\s*\n\s+cancel-in-progress: false/);
  const regex = /DOCS_ONLY_REGEX='([^']+)'/.exec(read('deploy-guiatv.sh'))[1];
  const re = new RegExp(regex);
  for (const path of ['docs/seo/x.md', 'README.md', 'graphify-out/graph.json', 'tasks/a', 'scripts/uptime-probe.mjs', '.github/workflows/uptime.yml']) assert.ok(re.test(path), `${path} is documentation-only`);
  for (const path of ['apps/backend/src/a.ts', 'apps/frontend/src/a.ts', 'scripts/post-boot-check.mjs', 'scripts/guiatv-ops.sh', 'deploy-guiatv.sh', 'package-lock.json', 'scripts/publish-release.mjs', '.github/workflows/deploy.yml']) assert.ok(!re.test(path), `${path} changes what runs`);
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

test('actions are pinned to a version', () => {
  for (const f of workflows) for (const m of read(`.github/workflows/${f}`).matchAll(/uses:\s*(\S+)/g)) assert.match(m[1], /@v?\d/, `${f}: ${m[1]}`);
});
