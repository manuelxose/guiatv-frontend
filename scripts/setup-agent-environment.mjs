import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const skills = path.join(root, '.agents', 'skills');
await mkdir(skills, { recursive: true });

const manifest = {
  source: 'repository-local, on-demand skills',
  skills: {
    impeccable: { source: 'https://github.com/pbakaus/impeccable', trigger: 'interface implementation or polish' },
    'web-design-guidelines': { source: 'https://github.com/vercel-labs/agent-skills', trigger: 'web UX/accessibility audit' },
    'ui-ux-pro-max': { source: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill', trigger: 'design exploration only' },
    'browser-validation': { source: 'repository workflow', trigger: 'Playwright, axe, console/network, responsive checks' },
  },
};
await writeFile(path.join(skills, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (!pkg.scripts['agent:verify']) throw new Error('agent:verify script is missing');
for (const command of ['graphify', 'node', 'npm']) {
  try { execFileSync('sh', ['-lc', `command -v ${command}`], { stdio: 'ignore' }); }
  catch { console.warn(`Missing prerequisite: ${command}`); }
}
console.log('Agent environment synchronized: manifest and repository-local skill directory are ready.');
