#!/usr/bin/env node
/**
 * KCV Template Registry Validation
 * Run: npm run check:templates
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Import the registry — this tests whether templates actually load
const templateRegistry = await import('../src/lib/templates/templateRegistry.js').catch(() => null);
const editorStore = await import('../src/lib/resume/editorStore.js').catch(() => null);

function log(label, status, detail = '') {
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  const color = status === 'PASS' ? '\x1b[32m' : status === 'WARN' ? '\x1b[33m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`  ${color}${icon}${reset} ${label.padEnd(48)} ${detail || ''}`);
}

function section(name) {
  console.log(`\n${name}`);
  console.log('─'.repeat(60));
}

let allPass = true;

// --- Test: Template registry module exists ---
section('Template Registry Module');
try {
  const mod = await import('../src/lib/templates/templateRegistry.ts');
  log('templateRegistry module loads', 'PASS');
} catch (e) {
  log('templateRegistry module loads', 'FAIL', e.message);
  allPass = false;
}

// --- Test: DEFAULT_TEMPLATE_ID exists ---
section('Canonical Constants');
try {
  const { DEFAULT_TEMPLATE_ID } = await import('../src/lib/templates/templateRegistry.ts');
  if (DEFAULT_TEMPLATE_ID === 'kcv-modern') {
    log('DEFAULT_TEMPLATE_ID = "kcv-modern"', 'PASS');
  } else {
    log('DEFAULT_TEMPLATE_ID', 'FAIL', `got "${DEFAULT_TEMPLATE_ID}"`);
    allPass = false;
  }
} catch (e) {
  log('DEFAULT_TEMPLATE_ID', 'FAIL', e.message);
  allPass = false;
}

// --- Test: TEMPLATES array has at least one entry ---
section('TEMPLATES Array');
let templates = [];
try {
  const mod = await import('../src/lib/templates/templateRegistry.ts');
  templates = mod.TEMPLATES || [];
  if (templates.length > 0) {
    log(`TEMPLATES has ${templates.length} template(s)`, 'PASS');
  } else {
    log('TEMPLATES is empty', 'FAIL', 'at least one template required');
    allPass = false;
  }
} catch (e) {
  log('TEMPLATES access', 'FAIL', e.message);
  allPass = false;
}

// --- Test: Every template has required fields ---
section('Template Shape Validation');
const requiredFields = ['id', 'name', 'description', 'render'];
if (templates.length > 0) {
  for (const tpl of templates) {
    const missing = requiredFields.filter((f) => !(f in tpl));
    if (missing.length === 0) {
      log(`"${tpl.id}" has all required fields`, 'PASS');
    } else {
      log(`"${tpl.id || '<unknown>'}" missing: ${missing.join(', ')}`, 'FAIL');
      allPass = false;
    }
    if (typeof tpl.render !== 'function') {
      log(`"${tpl.id}" render is not a function`, 'FAIL');
      allPass = false;
    }
  }
} else {
  log('No templates to validate', 'WARN');
}

// --- Test: kcv-modern template is registered ---
section('Default Template Registration');
const kcvModern = templates.find((t) => t.id === 'kcv-modern');
if (kcvModern) {
  log('"kcv-modern" is registered', 'PASS');
} else {
  log('"kcv-modern" NOT found in TEMPLATES', 'FAIL');
  allPass = false;
}

// --- Test: editorStore helper functions exist ---
section('editorStore Helpers');
const helpers = ['ensureValidTemplateId', 'renderWithTemplate'];
for (const h of helpers) {
  if (editorStore && editorStore[h]) {
    log(`${h}() exists`, 'PASS');
  } else {
    log(`${h}() NOT found in editorStore`, 'FAIL');
    allPass = false;
  }
}

// --- Test: renderWithTemplate with valid ID ---
section('renderWithTemplate() Tests');
let defaultResume;
try {
  const dr = await import('../src/lib/resume/defaultResume.ts');
  defaultResume = dr.defaultResume;
  log('defaultResume loads', 'PASS');
} catch (e) {
  log('defaultResume loads', 'FAIL', e.message);
  allPass = false;
}

if (defaultResume) {
  // Valid ID
  try {
    const result = editorStore.renderWithTemplate(defaultResume, 'kcv-modern');
    if (typeof result === 'string' && result.includes('documentclass')) {
      log('renderWithTemplate(kcv-modern) returns LaTeX', 'PASS');
    } else {
      log('renderWithTemplate(kcv-modern)', 'FAIL', 'did not return LaTeX string');
      allPass = false;
    }
  } catch (e) {
    log('renderWithTemplate(kcv-modern)', 'FAIL', e.message);
    allPass = false;
  }

  // Invalid ID — must not throw, must return fallback
  try {
    const result = editorStore.renderWithTemplate(defaultResume, 'invalid-template-xyz');
    if (typeof result === 'string' && result.includes('documentclass')) {
      log('renderWithTemplate(invalid) does not throw', 'PASS');
      log('renderWithTemplate(invalid) returns fallback LaTeX', 'PASS');
    } else {
      log('renderWithTemplate(invalid) did not return LaTeX', 'FAIL');
      allPass = false;
    }
  } catch (e) {
    log('renderWithTemplate(invalid) threw', 'FAIL', e.message);
    allPass = false;
  }

  // null/undefined ID — must not throw
  try {
    const result1 = editorStore.renderWithTemplate(defaultResume, null);
    const result2 = editorStore.renderWithTemplate(defaultResume, undefined);
    if (typeof result1 === 'string' && typeof result2 === 'string') {
      log('renderWithTemplate(null) does not throw', 'PASS');
      log('renderWithTemplate(undefined) does not throw', 'PASS');
    } else {
      log('null/undefined render', 'FAIL', 'did not return string');
      allPass = false;
    }
  } catch (e) {
    log('renderWithTemplate(null/undefined) threw', 'FAIL', e.message);
    allPass = false;
  }
}

// --- Test: ensureValidTemplateId ---
section('ensureValidTemplateId() Tests');
try {
  const valid = editorStore.ensureValidTemplateId('kcv-modern');
  if (valid === 'kcv-modern') {
    log('ensureValidTemplateId("kcv-modern") => "kcv-modern"', 'PASS');
  } else {
    log('ensureValidTemplateId("kcv-modern")', 'FAIL', `got "${valid}"`);
    allPass = false;
  }

  const fallback = editorStore.ensureValidTemplateId('nonexistent-template');
  if (fallback === 'kcv-modern') {
    log('ensureValidTemplateId("nonexistent") => "kcv-modern" (default)', 'PASS');
  } else {
    log('ensureValidTemplateId("nonexistent")', 'FAIL', `got "${fallback}"`);
    allPass = false;
  }

  const empty = editorStore.ensureValidTemplateId(null);
  if (empty === 'kcv-modern') {
    log('ensureValidTemplateId(null) => "kcv-modern" (default)', 'PASS');
  } else {
    log('ensureValidTemplateId(null)', 'FAIL', `got "${empty}"`);
    allPass = false;
  }
} catch (e) {
  log('ensureValidTemplateId tests', 'FAIL', e.message);
  allPass = false;
}

// Summary
section('Summary');
if (allPass) {
  console.log('  ✓ All template checks passed.');
} else {
  console.log('  ✗ Some template checks failed — review above.');
  process.exit(1);
}