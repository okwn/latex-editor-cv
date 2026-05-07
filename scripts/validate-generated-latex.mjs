#!/usr/bin/env node
/**
 * Validate generated LaTeX (static checks)
 * Run: npm run check:latex:static
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : status === 'WARN' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`  ${color}${icon}${reset} ${label.padEnd(52)} ${detail || ''}`);
}

function section(name) {
  console.log(`\n${name}`);
  console.log('─'.repeat(60));
}

let allPass = true;

section('Loading default resume LaTeX');
let latex;
try {
  const { defaultResume } = await import('../src/lib/resume/defaultResume.ts');
  const { renderWithTemplate } = await import('../src/lib/resume/editorStore.ts');
  latex = renderWithTemplate(defaultResume, 'kcv-modern');
  log('LaTeX generated', 'PASS', `length=${latex.length}`);
} catch (e) {
  log('LaTeX generation', 'FAIL', e.message);
  process.exit(1);
}

section('Static LaTeX Structure Checks');
const checks = [
  { label: 'Contains \\documentclass', test: () => latex.includes('\\documentclass') },
  { label: 'Contains \\begin{document}', test: () => latex.includes('\\begin{document}') },
  { label: 'Contains \\end{document}', test: () => latex.includes('\\end{document}') },
  { label: 'Contains \\usepackage{tcolorbox}', test: () => latex.includes('\\usepackage{tcolorbox}') },
  { label: 'Contains % KCV-BLOCK markers', test: () => latex.includes('% KCV-BLOCK') },
  { label: 'Does NOT contain \\newtcbox{projectcard}', test: () => !latex.includes('\\newtcbox{projectcard}') },
  { label: 'Does NOT contain invalid \\newtcbox', test: () => !/\\newtcbox\{[^\\]/.test(latex) },
];

for (const check of checks) {
  try {
    const result = check.test();
    if (result) {
      log(check.label, 'PASS');
    } else {
      log(check.label, 'FAIL', 'check failed');
      allPass = false;
    }
  } catch (e) {
    log(check.label, 'FAIL', e.message);
    allPass = false;
  }
}

section('Custom Command Definitions');
const cmdChecks = [
  { label: '\\cvname defined', pattern: /\\newcommand\{\\cvname\}\[/ },
  { label: '\\cvrole defined', pattern: /\\newcommand\{\\cvrole\}\[/ },
  { label: '\\contactitem defined', pattern: /\\newcommand\{\\contactitem\}\[/ },
  { label: '\\eduitem defined', pattern: /\\newcommand\{\\eduitem\}\[/ },
  { label: '\\skillgroup defined', pattern: /\\newcommand\{\\skillgroup\}\[/ },
  { label: '\\projectcard NOT defined (removed)', pattern: /\\newtcbox\{\\projectcard\}/, invert: true },
];

for (const check of cmdChecks) {
  const found = check.pattern.test(latex);
  if (check.invert ? !found : found) {
    log(check.label, 'PASS');
  } else {
    log(check.label, 'FAIL');
    allPass = false;
  }
}

section('URL Safety');
const urlChecks = [
  { label: 'href uses escaped URL', pattern: /\\href\{[^}]+\}\{[^}]+\}/ },
];
for (const check of urlChecks) {
  if (check.pattern.test(latex)) {
    log(check.label, 'PASS');
  } else {
    log(check.label, 'FAIL');
    allPass = false;
  }
}

section('Summary');
if (allPass) {
  console.log('  ✓ All static LaTeX checks passed.');
} else {
  console.log('  ✗ Some checks failed — review above.');
  process.exit(1);
}