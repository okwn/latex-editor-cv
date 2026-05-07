#!/usr/bin/env node
/**
 * KCV Local Environment Check
 * Run: npm run check:local
 */

import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : status === 'WARN' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`  ${color}${icon}${reset} ${label.padEnd(40)} ${detail || ''}`);
}

function section(name) {
  console.log(`\n${name}`);
  console.log('─'.repeat(60));
}

let allPass = true;

// Node/npm version
section('Node & npm');
const nodeVersion = process.version;
log('Node.js version', 'PASS', nodeVersion);

// node_modules
section('Dependencies');
const nodeModulesExists = existsSync(join(ROOT, 'node_modules'));
if (nodeModulesExists) {
  const pkgJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const depCount = Object.keys(pkgJson.dependencies || {}).length;
  log('node_modules installed', 'PASS', `${depCount} production deps`);
} else {
  log('node_modules installed', 'FAIL', 'Run: npm install');
  allPass = false;
}

// pdf.worker.mjs
section('PDF.js Worker');
const workerPath = join(ROOT, 'public', 'pdf.worker.mjs');
if (existsSync(workerPath)) {
  log('pdf.worker.mjs in public/', 'PASS');
} else {
  log('pdf.worker.mjs in public/', 'WARN', 'PDF preview may not work');
}

// compiled-cvs dir
section('Output Directory');
const compiledCvsDir = join(ROOT, 'public', 'compiled-cvs');
if (existsSync(compiledCvsDir)) {
  log('public/compiled-cvs/', 'PASS', 'exists');
} else {
  try {
    mkdirSync(compiledCvsDir, { recursive: true });
    log('public/compiled-cvs/', 'PASS', 'created');
  } catch {
    log('public/compiled-cvs/', 'FAIL', 'cannot create');
    allPass = false;
  }
}

// LaTeX compiler
section('LaTeX Compiler');
const compilers = [
  { name: 'tectonic', cmd: 'tectonic', args: ['--version'] },
  { name: 'xelatex', cmd: 'xelatex', args: ['-version'] },
  { name: 'pdflatex', cmd: 'pdflatex', args: ['-version'] },
];

let foundCompiler = null;
for (const c of compilers) {
  try {
    const out = execSync(`${c.cmd} ${c.args.join(' ')}`, { timeout: 5000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const versionMatch = out.match(/(\d+\.\d+(?:\.\d+)?)/);
    const version = versionMatch ? versionMatch[1] : out.split('\n')[0].trim().slice(0, 30);
    log(`${c.name} available`, 'PASS', `v${version}`);
    foundCompiler = c.name;
    break;
  } catch {
    log(`${c.name}`, 'FAIL', 'not found');
  }
}

if (!foundCompiler) {
  allPass = false;
  console.log('\n  Install LaTeX compiler:');
  console.log('  Arch / CachyOS: sudo pacman -S texlive-bin texlive-core texlive-latexextra texlive-fontsextra latexmk');
  console.log('  Ubuntu / Debian:  sudo apt install texlive-xetex texlive-latex-extra texlive-fonts-extra latexmk');
  console.log('  macOS:           brew install --cask mactex   # or: brew install tectonic');
  console.log('  Or Docker:       docker compose up --build   # TeX Live bundled in container');
}

// Environment variables (optional)
section('Environment Variables (optional)');
const envVars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY', 'OLLAMA_BASE_URL'];
let hasAnyAiKey = false;
for (const ev of envVars) {
  const val = process.env[ev];
  if (val) {
    const masked = ev.includes('KEY') ? `${ev.slice(0, 7)}***` : ev;
    log(`${ev}`, 'PASS', masked);
    hasAnyAiKey = true;
  }
}
if (!hasAnyAiKey) {
  log('AI keys', 'WARN', 'none set — AI features disabled (app still works)');
}

// Scripts
section('Package Scripts');
const scripts = ['dev', 'build', 'start', 'lint', 'typecheck', 'check:local'];
for (const s of scripts) {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  if (pkg.scripts?.[s]) {
    log(`npm run ${s}`, 'PASS', pkg.scripts[s]);
  } else {
    log(`npm run ${s}`, 'FAIL', 'not defined');
    allPass = false;
  }
}

// Summary
section('Summary');
if (allPass && foundCompiler) {
  console.log('  ✓ Environment fully ready. Run: npm run dev');
} else if (allPass && !foundCompiler) {
  console.log('  ⚠ App runs but PDF compilation disabled. Install LaTeX or use Docker.');
} else {
  console.log('  ✗ Some checks failed — review above.');
  process.exit(1);
}
