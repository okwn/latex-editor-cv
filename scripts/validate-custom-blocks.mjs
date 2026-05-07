#!/usr/bin/env node
/**
 * Validate that added blocks appear in generated LaTeX
 * Run: npm run check:custom-blocks
 */

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

// Load modules
const { defaultResume } = await import('../src/lib/resume/defaultResume.ts').catch(() => null);
const { renderWithTemplate } = await import('../src/lib/resume/editorStore.ts').catch(() => null);
const { addCustomBlock } = await import('../src/lib/resume/blockLayout.ts').catch(() => null);
const { normalizeBlockLayout } = await import('../src/lib/resume/blockLayout.ts').catch(() => null);

section('Module Loading');
if (!defaultResume || !renderWithTemplate) {
  log('Modules load', 'FAIL', 'could not load required modules');
  process.exit(1);
}
log('Modules load', 'PASS');

section('Build Test Resume with All Custom Block Types');

const testResume = JSON.parse(JSON.stringify(defaultResume));
testResume.customBlocks = [];

const langBlock = { id: 'test-lang-1', type: 'languages', title: 'Languages', items: [
  { language: 'English', proficiency: 'Native' },
  { language: 'Turkish', proficiency: 'Native' },
  { language: 'German', proficiency: 'B2' },
]};
const awardsBlock = { id: 'test-awards-1', type: 'awards', title: 'Awards', items: [
  { title: 'Best Developer Award', issuer: 'TechConf', year: '2024' },
  { title: 'Open Source Contributor', issuer: 'GitHub', year: '2023' },
]};
const linksBlock = { id: 'test-links-1', type: 'links', title: 'Links', items: [
  { label: 'GitHub', url: 'https://github.com/test' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/test' },
]};
const customTextBlock = { id: 'test-ct-1', type: 'customText', title: 'Research Interests', paragraphs: [
  'Distributed systems and cloud-native architectures',
  'AI-assisted development workflows and LLM integration patterns',
]};

testResume.customBlocks = [langBlock, awardsBlock, linksBlock, customTextBlock];
testResume.resumeLayout = testResume.resumeLayout || { version: 1, blocks: [], customBlocksOrder: [] };
testResume.resumeLayout.customBlocksOrder = ['test-lang-1', 'test-awards-1', 'test-links-1', 'test-ct-1'];

// Normalize
const normalized = normalizeBlockLayout ? normalizeBlockLayout(testResume) : testResume;

section('Generate LaTeX with All Custom Blocks');
let latex;
try {
  latex = renderWithTemplate(normalized, 'kcv-modern');
  log('LaTeX generated', 'PASS', `length=${latex.length}`);
} catch (e) {
  log('LaTeX generation', 'FAIL', e.message);
  process.exit(1);
}

section('Verify All Custom Block Sections Present');
const checks = [
  { label: 'Contains \\section{Languages}', test: () => latex.includes('\\section{Languages}') },
  { label: 'Contains English item in Languages', test: () => latex.includes('English') },
  { label: 'Contains Turkish item in Languages', test: () => latex.includes('Turkish') },
  { label: 'Contains German item in Languages', test: () => latex.includes('German') },
  { label: 'Contains \\section{Awards}', test: () => latex.includes('\\section{Awards}') },
  { label: 'Contains Best Developer Award', test: () => latex.includes('Best Developer Award') },
  { label: 'Contains GitHub Award issuer', test: () => latex.includes('GitHub') },
  { label: 'Contains \\section{Links}', test: () => latex.includes('\\section{Links}') },
  { label: 'Contains GitHub URL in Links', test: () => latex.includes('github.com') },
  { label: 'Contains \\section{Research Interests}', test: () => latex.includes('\\section{Research Interests}') },
  { label: 'Contains Research paragraph', test: () => latex.includes('Distributed systems') },
];

for (const check of checks) {
  try {
    const result = check.test();
    if (result) {
      log(check.label, 'PASS');
    } else {
      log(check.label, 'FAIL', 'not found in generated LaTeX');
      allPass = false;
    }
  } catch (e) {
    log(check.label, 'FAIL', e.message);
    allPass = false;
  }
}

section('Verify Core Blocks Still Work');
const coreChecks = [
  { label: 'Contains \\section{Summary}', test: () => latex.includes('\\section{Summary}') },
  { label: 'Contains \\section{Education}', test: () => latex.includes('\\section{Education}') },
  { label: 'Contains \\section{Skills}', test: () => latex.includes('\\section{Skills}') },
  { label: 'Contains \\section{Projects}', test: () => latex.includes('\\section{Projects}') },
  { label: 'Contains \\section{Focus Areas}', test: () => latex.includes('\\section{Focus Areas}') },
  { label: 'Contains \\section{Certifications}', test: () => latex.includes('\\section{Certifications}') },
];

for (const check of coreChecks) {
  try {
    const result = check.test();
    if (result) {
      log(check.label, 'PASS');
    } else {
      log(check.label, 'FAIL');
      allPass = false;
    }
  } catch (e) {
    log(check.label, 'FAIL', e.message);
    allPass = false;
  }
}

section('Test Empty Custom Block Skipping');
// Build a resume with empty languages block
const emptyResume = JSON.parse(JSON.stringify(defaultResume));
emptyResume.customBlocks = [
  { id: 'empty-lang', type: 'languages', title: 'Languages', items: [{ language: '', proficiency: '' }] },
];
emptyResume.resumeLayout = emptyResume.resumeLayout || { version: 1, blocks: [], customBlocksOrder: ['empty-lang'] };
emptyResume.resumeLayout.customBlocksOrder = ['empty-lang'];
const normalizedEmpty = normalizeBlockLayout ? normalizeBlockLayout(emptyResume) : emptyResume;

let emptyLatex;
try {
  emptyLatex = renderWithTemplate(normalizedEmpty, 'kcv-modern');
  log('Empty block LaTeX generated', 'PASS');
} catch (e) {
  log('Empty block LaTeX generation', 'FAIL', e.message);
  allPass = false;
}

const emptyLangCheck = emptyLatex && !emptyLatex.includes('\\section{Languages}');
if (emptyLangCheck) {
  log('Empty Languages block correctly skipped', 'PASS');
} else {
  log('Empty Languages block incorrectly rendered', 'FAIL');
  allPass = false;
}

section('Summary');
if (allPass) {
  console.log('  ✓ All custom block checks passed.');
} else {
  console.log('  ✗ Some checks failed — review above.');
  process.exit(1);
}