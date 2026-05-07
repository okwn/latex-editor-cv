'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore, EditorMode } from '@/lib/resume/editorStore';
import { useToast } from '@/components/ui/Toast';
import { TakeSnapshotButton } from '@/components/editor/TakeSnapshotButton';
import { SnapshotPanel } from '@/components/editor/SnapshotPanel';
import {
  Sparkles,
  Play,
  Download,
  Keyboard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileWarning,
  XCircle,
  Camera,
  ChevronLeft,
  Settings,
} from 'lucide-react';

type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

interface TopBarProps {
  cvId: string;
  cvTitle: string;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  showLatexPanel: boolean;
  onToggleLatexPanel: () => void;
  onBack?: () => void;
}

function StatusBadge({ compileStatus, isDirty }: { compileStatus: CompileStatus; isDirty: boolean }) {
  if (compileStatus === 'compiling') {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-400">Compiling…</span>
      </span>
    );
  }
  if (compileStatus === 'success' && !isDirty) {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-green-400">PDF ready</span>
      </span>
    );
  }
  if (compileStatus === 'error') {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <span className="text-red-400">Failed</span>
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-400">Unsaved</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      <span className="text-zinc-500">Not compiled</span>
    </span>
  );
}

export function TopBar({
  cvId,
  cvTitle,
  editorMode,
  onEditorModeChange,
  showLatexPanel,
  onToggleLatexPanel,
  onBack,
}: TopBarProps) {
  const toast = useToast();
  const {
    compile,
    compileStatus,
    latexSource,
    toggleAiDrawer,
    isDirty,
  } = useEditorStore();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);

  const handleCompile = useCallback(async () => {
    if (compileStatus === 'compiling' || !latexSource) return;
    await compile();
    const status = useEditorStore.getState().compileStatus;
    if (status === 'success') {
      toast({ message: 'PDF compiled', type: 'success' });
    } else if (status === 'error') {
      toast({ message: 'Compilation failed', type: 'error' });
    }
  }, [compile, compileStatus, latexSource, toast]);

  const handleExport = useCallback(() => {
    const { pdfUrl } = useEditorStore.getState();
    if (!pdfUrl) {
      toast({ message: 'No PDF — compile first', type: 'warning' });
      return;
    }
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${cvTitle || 'cv'}.pdf`;
    a.click();
    toast({ message: 'PDF exported', type: 'success' });
  }, [cvTitle, toast]);

  return (
    <>
      <header className="h-12 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 z-30">
        {/* Back */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Dashboard"
          >
            <ChevronLeft size={15} />
          </button>
        )}

        {/* CV Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-zinc-100 truncate max-w-[12rem]">{cvTitle}</span>
          <StatusBadge compileStatus={compileStatus} isDirty={isDirty} />
        </div>

        <div className="w-px h-5 bg-zinc-700 shrink-0" />

        {/* Primary actions */}
        <button
          onClick={handleCompile}
          disabled={compileStatus === 'compiling' || !latexSource}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
        >
          <Play size={11} />
          <span className="hidden sm:inline">{compileStatus === 'compiling' ? 'Compiling…' : 'Compile'}</span>
        </button>

        <button
          onClick={handleExport}
          disabled={compileStatus !== 'success'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
        >
          <Download size={11} />
          <span className="hidden sm:inline">Export</span>
        </button>

        <TakeSnapshotButton cvId={cvId} />

        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center rounded-md bg-zinc-800 p-0.5 gap-0.5 shrink-0">
          <button
            onClick={() => onEditorModeChange('blocks')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              editorMode === 'blocks'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            Blocks
          </button>
          <button
            onClick={() => onEditorModeChange('latex')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
              editorMode === 'latex'
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            LaTeX
          </button>
        </div>

        {/* Show LaTeX panel */}
        <button
          onClick={onToggleLatexPanel}
          className={cn(
            'p-1.5 rounded transition-colors',
            showLatexPanel
              ? 'bg-zinc-700 text-zinc-200'
              : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          )}
          title={showLatexPanel ? 'Hide LaTeX' : 'Show LaTeX'}
        >
          {showLatexPanel ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-zinc-700 shrink-0" />

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSnapshotPanel((v) => !v)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showSnapshotPanel
                ? 'bg-zinc-700 text-amber-400'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
            title="Snapshots"
          >
            <Camera size={14} />
          </button>

          <button
            onClick={toggleAiDrawer}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
            title="AI Assistant"
          >
            <Sparkles size={14} />
          </button>

          <a
            href="/settings"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </a>
        </div>
      </header>

      {/* LaTeX mode warning banner */}
      {editorMode === 'latex' && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-900/20 border-b border-purple-800/30 text-xs text-purple-300">
          <XCircle size={11} className="shrink-0" />
          <span>
            <strong>LaTeX mode:</strong> Direct edits to source. Block forms do not auto-update — use &ldquo;Regenerate from Blocks&rdquo; to sync.
          </span>
        </div>
      )}

      {/* Snapshot panel */}
      {showSnapshotPanel && (
        <div className="absolute top-12 right-4 z-[60] w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          <SnapshotPanel cvId={cvId} onClose={() => setShowSnapshotPanel(false)} />
        </div>
      )}

      {/* Shortcuts popover */}
      {showShortcuts && (
        <div className="absolute top-14 right-4 z-[60] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 text-xs w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-200">Shortcuts</h3>
            <button onClick={() => setShowShortcuts(false)} className="text-zinc-500 hover:text-zinc-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {[
              { keys: ['⌘', '↵'], action: 'Compile' },
              { keys: ['⌘', 'J'], action: 'AI drawer' },
            ].map(({ keys, action }) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-zinc-400">{action}</span>
                <div className="flex items-center gap-0.5">
                  {keys.map((k) => <kbd key={k} className="kbd">{k}</kbd>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}