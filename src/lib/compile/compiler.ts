import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CompilerInfo {
  name: string;
  version?: string;
  executable: string;
  supportsSyncTeX: boolean;
}

export interface CompileResult {
  ok: boolean;
  pdfUrl?: string;
  compileId?: string;
  log: string;
  synctexAvailable: boolean;
  errors?: { message: string; line?: number; raw?: string }[];
}

function tryCommand(cmd: string, args: string[], timeoutMs: number): { exitCode: number; stdout: string; stderr: string } {
  try {
    const stdout = execSync(cmd + ' ' + args.join(' '), { timeout: timeoutMs, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { exitCode: 0, stdout: stdout || '', stderr: '' };
  } catch (err: unknown) {
    const error = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: error.status ?? -1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

/**
 * Detect available LaTeX compilers. Prefer pdflatex (most reliable) or tectonic.
 * xelatex is skipped because the xelatex format file is often missing on Linux.
 */
export function detectLatexCompiler(): CompilerInfo | null {
  // pdflatex — most reliable, no format file dependencies
  const pdfResult = tryCommand('pdflatex', ['-version'], 5000);
  if (pdfResult.exitCode === 0) {
    const versionMatch = pdfResult.stdout?.match(/(\d+\.\d+(?:\.\d+)?)/);
    return {
      name: 'pdflatex',
      version: versionMatch ? versionMatch[1] : undefined,
      executable: 'pdflatex',
      supportsSyncTeX: true,
    };
  }

  // tectonic — self-contained, no system format files needed
  const tectonicResult = tryCommand('tectonic', ['--version'], 5000);
  if (tectonicResult.exitCode === 0) {
    const versionMatch = tectonicResult.stdout?.match(/(\d+\.\d+(?:\.\d+)?)/);
    return {
      name: 'tectonic',
      version: versionMatch ? versionMatch[1] : undefined,
      executable: 'tectonic',
      supportsSyncTeX: false,
    };
  }

  return null;
}

async function runCompiler(
  executable: string,
  compilerName: string,
  texPath: string,
  tmpDir: string,
  timeoutMs: number,
  enableSyncTeX: boolean
): Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    const args: string[] = [];

    if (compilerName === 'tectonic') {
      args.push(texPath);
      if (enableSyncTeX) args.push('--synctex');
    } else {
      // pdflatex (default)
      args.push('-interaction=nonstopmode', '-halt-on-error');
      if (enableSyncTeX) args.push('-synctex=1');
      args.push(texPath);
    }

    let process: ReturnType<typeof spawn>;
    try {
      process = spawn(executable, args, { cwd: tmpDir, timeout: timeoutMs, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      resolve({ exitCode: -1, stdout: '', stderr: String(err), timedOut: false });
      return;
    }

    let timedOut = false;
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      timedOut = true;
      process.kill('SIGTERM');
    }, timeoutMs);

    process.stdout?.on('data', (d) => { stdout += d.toString(); });
    process.stderr?.on('data', (d) => { stderr += d.toString(); });

    process.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? -1, stdout, stderr, timedOut });
    });

    process.on('error', (err) => {
      clearTimeout(timer);
      resolve({ exitCode: -1, stdout, stderr: err.message, timedOut: false });
    });
  });
}

interface LatexError {
  message: string;
  line?: number;
  raw?: string;
}

function parseLatexLog(log: string): LatexError[] {
  const errors: LatexError[] = [];
  const lines = log.split('\n');
  const errorPatterns = [
    { regex: /^!\s*(.+)$/, extract: (m: string) => ({ message: m.replace(/^!\s*/, '') }) },
    { regex: /^l\.(\d+)\s+(.*)$/, extract: (m: string, line: string) => ({ line: parseInt(line, 10), message: m }) },
    { regex: /\(line\s+(\d+)\)/i, extract: (m: string, line: string) => ({ line: parseInt(line, 10), message: m }) },
    { regex: /Undefined control sequence/i, extract: (m: string) => ({ message: m }) },
    { regex: /Missing \$ inserted/i, extract: (m: string) => ({ message: m }) },
    { regex: /Emergency stop/i, extract: (m: string) => ({ message: m }) },
    { regex: /File not found/i, extract: (m: string) => ({ message: m }) },
    { regex: /Overfull \\hbox/i, extract: (m: string) => ({ message: 'Overfull hbox: ' + m }) },
    { regex: /Underfull \\hbox/i, extract: (m: string) => ({ message: 'Underfull hbox: ' + m }) },
  ];

  for (const line of lines) {
    for (const pattern of errorPatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const extracted = pattern.extract(line, match[1]);
        if (!errors.find((e) => e.message === extracted.message)) {
          errors.push(extracted);
        }
      }
    }
  }
  return errors;
}

export async function compileLatex(latexSource: string): Promise<CompileResult> {
  const COMPILER_TIMEOUT_MS = 90000;
  const OUTPUT_DIR = path.join(process.cwd(), 'public', 'compiled-cvs');

  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  } catch { /* directory may exist */ }

  const compiler = detectLatexCompiler();
  if (!compiler) {
    return {
      ok: false,
      log: 'No LaTeX compiler found. Install tectonic or pdflatex.',
      synctexAvailable: false,
      errors: [{ message: 'No LaTeX compiler detected. Please install tectonic or pdflatex.' }],
    };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kcv-'));
  const texPath = path.join(tmpDir, 'main.tex');

  try {
    const sanitized = latexSource.replace(/\\input\{[^}]*\}/g, (match) => {
      if (/^[a-zA-Z0-9_\-.\/]+$/.test(match)) return match;
      return '';
    });

    fs.writeFileSync(texPath, sanitized, 'utf8');

    const result = await runCompiler(
      compiler.executable,
      compiler.name,
      texPath,
      tmpDir,
      COMPILER_TIMEOUT_MS,
      compiler.supportsSyncTeX
    );

    const fullLog = result.stdout + '\n' + result.stderr;

    if (result.timedOut) {
      return {
        ok: false,
        log: fullLog.slice(0, 8000),
        synctexAvailable: false,
        errors: [{ message: `Compilation timed out after ${COMPILER_TIMEOUT_MS / 1000}s` }],
      };
    }

    if (result.exitCode !== 0) {
      const parsedErrors = parseLatexLog(fullLog);
      return {
        ok: false,
        log: fullLog.slice(0, 8000),
        synctexAvailable: false,
        errors: parsedErrors.length > 0 ? parsedErrors : [{ message: 'LaTeX compilation failed', raw: fullLog.slice(0, 500) }],
      };
    }

    const compileId = path.basename(tmpDir);
    const pdfName = compileId + '.pdf';
    const pdfDest = path.join(OUTPUT_DIR, pdfName);

    const pdfFiles = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      return {
        ok: false,
        log: fullLog.slice(0, 8000),
        synctexAvailable: false,
        errors: [{ message: 'PDF was not generated' }],
      };
    }

    const srcPdf = path.join(tmpDir, pdfFiles[0]);
    fs.copyFileSync(srcPdf, pdfDest);

    const srcSynctexGz = srcPdf.replace('.pdf', '.synctex.gz');
    const srcSynctex = srcPdf.replace('.pdf', '.synctex');
    const hasSyncTeX = fs.existsSync(srcSynctexGz) || fs.existsSync(srcSynctex);
    if (hasSyncTeX) {
      try {
        if (fs.existsSync(srcSynctexGz)) {
          fs.copyFileSync(srcSynctexGz, path.join(OUTPUT_DIR, compileId + '.synctex.gz'));
        } else {
          fs.copyFileSync(srcSynctex, path.join(OUTPUT_DIR, compileId + '.synctex'));
        }
      } catch { /* best effort */ }
    }

    const pdfUrl = `/compiled-cvs/${pdfName}`;

    return {
      ok: true,
      pdfUrl,
      compileId,
      log: fullLog.slice(0, 4000),
      synctexAvailable: hasSyncTeX,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      ok: false,
      log: error.message,
      synctexAvailable: false,
      errors: [{ message: error.message }],
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch { /* best effort cleanup */ }
  }
}