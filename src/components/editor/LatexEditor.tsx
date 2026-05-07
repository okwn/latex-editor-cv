'use client';

import { useEffect, useRef, useCallback } from 'react';
import Editor, { OnMount, OnChange, loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useEditorStore, CompileError } from '@/lib/resume/editorStore';
import { CompileErrorsPanel } from './CompileErrorsPanel';

loader.init().then((monaco) => {
  const langs = monaco.languages.getLanguages();
  if (!langs.find((l: { id: string }) => l.id === 'latex')) {
    monaco.languages.register({ id: 'latex' });

    monaco.languages.setMonarchTokensProvider('latex', {
      tokenizer: {
        root: [
          [/\\[a-zA-Z]+/, 'keyword'],
          [/\\[{}]/, 'keyword'],
          [/[{}]/, 'delimiter.brace'],
          [/\$\$/, 'delimiter.math'],
          [/\$/, 'delimiter.math'],
          [/%.*$/, 'comment'],
          [/\\\\/, 'keyword'],
        ],
      },
    });

    monaco.editor.defineTheme('latex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7dd3fc', fontStyle: 'bold' },
        { token: 'comment', foreground: '6b7280' },
        { token: 'delimiter.math', foreground: 'fbbf24' },
        { token: 'delimiter.brace', foreground: 'f472b6' },
      ],
      colors: {
        'editor.background': '#09090b',
        'editor.foreground': '#e4e4e7',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editor.selectionBackground': '#2563eb33',
        'editor.lineHighlightBackground': '#18181b',
        'editorCursor.foreground': '#2563eb',
      },
    });
  }
});

interface LatexEditorProps {
  onCursorChange?: (line: number, column: number) => void;
}

function applyDiagnostics(monaco: typeof Monaco, errors: CompileError[], model: Monaco.editor.ITextModel | null) {
  if (!model) return;
  const markers = errors.map((err) => ({
    severity:
      err.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : err.severity === 'warning'
        ? monaco.MarkerSeverity.Warning
        : monaco.MarkerSeverity.Info,
    startLineNumber: err.line,
    endLineNumber: err.line,
    startColumn: err.column || 1,
    endColumn: model.getLineMaxColumn(err.line),
    message: err.message,
  }));
  monaco.editor.setModelMarkers(model, 'latex-compile', markers);
}

function clearDiagnostics(monaco: typeof Monaco, model: Monaco.editor.ITextModel | null) {
  if (!model) return;
  monaco.editor.setModelMarkers(model, 'latex-compile', []);
}

function flashLineDecoration(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  line: number
) {
  const decorations = editor.createDecorationsCollection([
    {
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'line-highlight-flash',
        glyphMarginClassName: 'glyph-flash',
      },
    },
  ]);

  setTimeout(() => {
    decorations.clear();
  }, 2000);
}

export function LatexEditor({ onCursorChange }: LatexEditorProps) {
  const {
    latexSource,
    compileErrors,
    rawLatexMode,
    setLatexSource,
    generateFromBlocks,
    resetToTemplate,
    toggleRawLatexMode,
  } = useEditorStore();

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange: OnChange = useCallback(
    (value) => {
      setLatexSource(value ?? '');
    },
    [setLatexSource]
  );

  const jumpToLine = useCallback((line: number) => {
    if (editorRef.current && monacoRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
      flashLineDecoration(editorRef.current, monacoRef.current, line);
    }
  }, []);

  const handleEditorMount: OnMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Define flash highlight style
      monaco.editor.defineTheme('latex-flash', {
        base: 'vs-dark',
        inherit: false,
        rules: [],
        colors: {
          'editor.lineHighlightBackground': '#2563eb33',
          'editor.lineHighlightBorder': '#2563eb',
        },
      });

      // Wire cursor position tracking
      editor.onDidChangeCursorPosition((e) => {
        if (onCursorChange) {
          onCursorChange(e.position.lineNumber, e.position.column);
        }
      });

      // Apply initial diagnostics
      if (compileErrors.length > 0) {
        applyDiagnostics(monaco, compileErrors, editor.getModel());
      }
    },
    [compileErrors, onCursorChange]
  );

  // Apply diagnostics when errors change (after mount)
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (compileErrors.length > 0) {
        applyDiagnostics(monacoRef.current, compileErrors, model);
      } else {
        clearDiagnostics(monacoRef.current, model);
      }
    }
  }, [compileErrors]);

  return (
    <div className="flex flex-col h-full">
      {/* Minimal toolbar — main actions are in the top bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-800/50 bg-zinc-900/30 text-xs">
        <button
          onClick={resetToTemplate}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          title="Reset to template"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          onClick={generateFromBlocks}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          title="Regenerate from blocks"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="hidden sm:inline">Regenerate</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={toggleRawLatexMode}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            rawLatexMode
              ? 'bg-purple-600/20 text-purple-400'
              : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
          }`}
          title="Toggle raw LaTeX mode"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          <span className="hidden sm:inline">{rawLatexMode ? 'Raw LaTeX' : 'Blocks'}</span>
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="latex"
          theme="latex-dark"
          value={latexSource}
          onChange={handleChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            smoothScrolling: true,
            formatOnPaste: false,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            cursorBlinking: 'smooth',
            renderLineHighlight: 'line',
            tabSize: 2,
            insertSpaces: true,
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            glyphMargin: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>

      {/* Error panel */}
      <CompileErrorsPanel onJumpToLine={jumpToLine} />
    </div>
  );
}