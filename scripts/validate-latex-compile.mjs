#!/usr/bin/env node
/**
 * Validate LaTeX compilation
 * Run: npm run check:latex
 */

import { execSync } from 'child_process';
import { writeFileSync, readdirSync, unlinkSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';

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

// Detect best available compiler
section('Compiler Detection');
const compilers = [
  { name: 'pdflatex', cmd: 'pdflatex', args: ['-version'] },
  { name: 'tectonic', cmd: 'tectonic', args: ['--version'] },
  { name: 'xelatex', cmd: 'xelatex', args: ['-version'] },
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
  console.log('  ✗ No LaTeX compiler found. Install one and retry.');
  process.exit(1);
}

// Generate LaTeX from default resume
section('Generating LaTeX');
let latex;
try {
  const { defaultResume } = await import('../src/lib/resume/defaultResume.ts');
  const { renderWithTemplate } = await import('../src/lib/resume/editorStore.ts');
  latex = renderWithTemplate(defaultResume, 'kcv-modern');
  log('LaTeX generated', 'PASS', `${latex.length} chars`);
} catch (e) {
  log('LaTeX generation', 'FAIL', e.message);
  process.exit(1);
}

// Write temp file
section('Writing temp .tex');
const tmpDir = mkdtempSync(join(os.tmpdir(), 'kcv-validate-'));
const texPath = join(tmpDir, 'main.tex');
try {
  writeFileSync(texPath, latex, 'utf8');
  log('main.tex written', 'PASS', tmpDir);
} catch (e) {
  log('main.tex write', 'FAIL', e.message);
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
}

// Compile
section(`Compiling with ${foundCompiler}`);
let logOutput = '';
try {
  let cmd, args;
  if (foundCompiler === 'latexmk') {
    cmd = 'latexmk';
    args = ['-xelatex', '-interaction=nonstopmode', '-halt-on-error', '-synctex=1', '-pdfxe', texPath];
  } else if (foundCompiler === 'xelatex') {
    cmd = 'xelatex';
    args = ['-interaction=nonstopmode', '-halt-on-error', '-synctex=1', texPath];
  } else if (foundCompiler === 'tectonic') {
    cmd = 'tectonic';
    args = [texPath, '--synctex'];
  } else {
    cmd = 'pdflatex';
    args = ['-interaction=nonstopmode', '-halt-on-error', '-synctex=1', texPath];
  }
  const out = execSync(`${cmd} ${args.join(' ')}`, {
    cwd: tmpDir,
    timeout: 90000,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  logOutput = out;
  log('Compilation finished', 'PASS');
} catch (e) {
  const err = /** @type {{ stdout?: string; stderr?: string; status?: number }} */ (e);
  const fullOut = (err.stdout || '') + '\n' + (err.stderr || '');
  logOutput = fullOut;
  log('Compilation exited non-zero', 'FAIL', `status=${err.status}`);
  // Show first 500 chars of error for debugging
  const firstErr = fullOut.split('\n').find((l) => l.startsWith('!')) || fullOut.slice(0, 300);
  log('Error preview', 'FAIL', firstErr.slice(0, 120));
  allPass = false;
}

// Check for PDF
section('PDF Output Check');
const pdfFiles = readdirSync(tmpDir).filter((f) => f.endsWith('.pdf'));
if (pdfFiles.length > 0) {
  log(`PDF generated: ${pdfFiles[0]}`, 'PASS');
} else {
  log('No PDF found', 'FAIL');
  allPass = false;
  // Show first error line
  const firstError = logOutput.split('\n').find((l) => l.startsWith('!'));
  if (firstError) log('First error', 'FAIL', firstError.slice(0, 80));
}

// Cleanup
section('Cleanup');
try {
  rmSync(tmpDir, { recursive: true, force: true });
  log('Temp directory removed', 'PASS');
} catch (e) {
  log('Cleanup', 'WARN', e.message);
}

section('Summary');
if (allPass) {
  console.log('  ✓ Default resume compiles to PDF successfully.');
} else {
  console.log('  ✗ Compilation failed — review errors above.');
  process.exit(1);
}