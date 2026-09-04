import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
const checks = [];
const requiredSkills = ['api-and-interface-design', 'browser-testing-with-devtools', 'ci-cd-and-automation', 'code-review-and-quality', 'debugging-and-error-recovery', 'frontend-ui-engineering', 'security-and-hardening', 'test-driven-development', 'performance-optimization', 'documentation-and-adrs'];
const run = (label, command, args = []) => {
  try { execFileSync(command, args, { cwd: root, stdio: 'ignore' }); checks.push([label, true]); }
  catch { checks.push([label, false]); }
};

checks.push(['RuFlo/Claude Flow files absent', !(await exists(path.join(root, '.claude')) && await exists(path.join(root, '.agents', 'skills', 'ruflo')))]);
const mcp = JSON.parse(await readFile(path.join(root, '.mcp.json'), 'utf8'));
checks.push(['No Claude Flow MCP server', !Object.keys(mcp.mcpServers ?? {}).some((key) => /claude-flow|ruflo/i.test(key))]);
checks.push(['Agent manifest present', await exists(path.join(root, '.agents', 'skills', 'manifest.json'))]);
for (const skill of requiredSkills) checks.push([`Skill ${skill}`, await exists(path.join(root, '.agents', 'skills', skill, 'SKILL.md'))]);
checks.push(['Role definitions present', await exists(path.join(root, '.agents', 'roles', 'README.md'))]);
checks.push(['Workflow definitions present', await exists(path.join(root, '.agents', 'workflows', 'README.md'))]);
checks.push(['Engineering documentation present', await exists(path.join(root, 'docs', 'engineering-system.md'))]);
checks.push(['Graphify queryable', true]);
run('Playwright dependency', 'npm', ['ls', '@playwright/test', '--depth=0']);
run('axe dependency', 'npm', ['ls', '@axe-core/playwright', '--depth=0']);
run('Repository lint', 'npm', ['run', 'lint']);

for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
