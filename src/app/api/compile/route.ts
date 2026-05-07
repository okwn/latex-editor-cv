import { NextResponse } from 'next/server';
import { compileLatex, detectLatexCompiler } from '@/lib/compile/compiler';
import { loadSyncTeXData } from '@/lib/compile/synctex';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'compiled-cvs');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const latexSource = body.latexSource || body.latex;

    if (!latexSource || typeof latexSource !== 'string') {
      return NextResponse.json(
        { ok: false, errors: [{ message: 'latexSource is required' }], log: '' },
        { status: 400 }
      );
    }

    if (latexSource.length > 500_000) {
      return NextResponse.json(
        { ok: false, errors: [{ message: 'LaTeX source too large (max 500KB)' }], log: '' },
        { status: 400 }
      );
    }

    const result = await compileLatex(latexSource);

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { ok: false, errors: [{ message: 'Internal server error: ' + error.message }], log: '' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'compiler';

  if (action === 'compiler') {
    const compiler = detectLatexCompiler();
    return NextResponse.json({
      compiler: compiler
        ? { name: compiler.name, version: compiler.version, executable: compiler.executable, supportsSyncTeX: compiler.supportsSyncTeX }
        : null,
    });
  }

  if (action === 'synctex') {
    // GET /api/compile?action=synctex&compileId=...
    const compileId = searchParams.get('compileId');

    if (!compileId) {
      return NextResponse.json({ ok: false, error: 'compileId is required' }, { status: 400 });
    }

    // Prevent path traversal — only allow safe compile IDs
    if (!/^[a-zA-Z0-9_-]+$/.test(compileId)) {
      return NextResponse.json({ ok: false, error: 'Invalid compileId' }, { status: 400 });
    }

    const data = loadSyncTeXData(compileId, OUTPUT_DIR);
    if (!data || !data.hasData) {
      return NextResponse.json({ ok: false, error: 'SyncTeX file not found', hasData: false });
    }

    return NextResponse.json({ ok: true, records: data.records, hasData: true });
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
}