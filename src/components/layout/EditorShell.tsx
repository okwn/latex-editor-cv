'use client';

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useEditorStore } from '@/lib/resume/editorStore';
import { TakeSnapshotButton } from '@/components/editor/TakeSnapshotButton';
import { SnapshotPanel } from '@/components/editor/SnapshotPanel';
import { BlockEditorRouter } from '@/components/blocks/BlockEditorRouter';
import {
  Sparkles,
  Play,
  Download,
  ChevronLeft,
  Settings,
  LayoutPanelLeft,
  Code2,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileWarning,
  Camera,
} from 'lucide-react';
import type { EditorMode } from '@/lib/resume/editorStore';

type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

const PANEL_SIZES_KEY = 'kcv-editor-panels';

interface PanelSizes {
  blockWidth: number;
  latexWidth: number;
  previewWidth: number;
  showLatex: boolean;
  showPreview: boolean;
}

const DEFAULT_SIZES: PanelSizes = {
  blockWidth: 35,
  latexWidth: 30,
  previewWidth: 30,
  showLatex: false,
  showPreview: true,
};

function loadSizes(): PanelSizes {
  try {
    const raw = localStorage.getItem(PANEL_SIZES_KEY);
    if (!raw) return DEFAULT_SIZES;
    return { ...DEFAULT_SIZES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SIZES;
  }
}

function saveSizes(sizes: PanelSizes): void {
  try {
    localStorage.setItem(PANEL_SIZES_KEY, JSON.stringify(sizes));
  } catch {
    // ignore
  }
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

interface EditorShellProps {
  children: ReactNode;
  cvId: string;
  cvTitle: string;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  showLatex: boolean;
  onToggleLatex: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  showBlocks: boolean;
  onToggleBlocks: () => void;
  onBack?: () => void;
}

export function EditorShell({
  children,
  cvId,
  cvTitle,
  editorMode,
  onEditorModeChange,
  showLatex,
  onToggleLatex,
  showPreview,
  onTogglePreview,
  showBlocks,
  onToggleBlocks,
  onBack,
}: EditorShellProps) {
  const toast = useToast();
  const {
    compile,
    compileStatus,
    latexSource,
    toggleAiDrawer,
    isDirty,
  } = useEditorStore();

  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);

  const handleCompile = useCallback(async () => {
    if (compileStatus === 'compiling' || !latexSource) return;
    await compile();
    const status = useEditorStore.getState().compileStatus;
    if (status === 'success') toast({ message: 'PDF compiled', type: 'success' });
    else if (status === 'error') toast({ message: 'Compilation failed', type: 'error' });
  }, [compile, compileStatus, latexSource, toast]);

  const handleExport = useCallback(() => {
    const { pdfUrl } = useEditorStore.getState();
    if (!pdfUrl) { toast({ message: 'No PDF — compile first', type: 'warning' }); return; }
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${cvTitle || 'cv'}.pdf`;
    a.click();
    toast({ message: 'PDF exported', type: 'success' });
  }, [cvTitle, toast]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0 z-30">
        {/* Back */}
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors" title="Dashboard">
            <ChevronLeft size={15} />
          </button>
        )}

        {/* CV Title + Status */}
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

        {/* Panel toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBlocks}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
              showBlocks ? 'bg-zinc-700 text-zinc-200' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
            title={showBlocks ? 'Hide Blocks' : 'Show Blocks'}
          >
            <LayoutPanelLeft size={13} />
            <span className="hidden lg:inline">{showBlocks ? 'Hide Blocks' : 'Blocks'}</span>
          </button>

          <button
            onClick={onToggleLatex}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
              showLatex ? 'bg-zinc-700 text-zinc-200' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
            title={showLatex ? 'Hide LaTeX' : 'Show LaTeX'}
          >
            <Code2 size={13} />
            <span className="hidden lg:inline">{showLatex ? 'Hide Code' : 'Code'}</span>
          </button>

          <button
            onClick={onTogglePreview}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
              showPreview ? 'bg-zinc-700 text-zinc-200' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
          >
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            <span className="hidden lg:inline">{showPreview ? 'Hide Preview' : 'Preview'}</span>
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-700 shrink-0" />

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSnapshotPanel((v) => !v)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showSnapshotPanel ? 'bg-zinc-700 text-amber-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
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

      {/* LaTeX mode warning */}
      {editorMode === 'latex' && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-900/20 border-b border-purple-800/30 text-xs text-purple-300 shrink-0">
          <XCircle size={11} className="shrink-0" />
          <span>
            <strong>LaTeX mode:</strong> Direct edits to source. Block forms do not auto-update — use &ldquo;Regenerate from Blocks&rdquo; to sync.
          </span>
        </div>
      )}

      {/* Editor panels */}
      <div className="flex-1 overflow-hidden min-h-0">
        {children}
      </div>

      {/* Snapshot panel popover */}
      {showSnapshotPanel && (
        <div
          className="absolute top-12 right-4 z-[60] w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          <SnapshotPanel cvId={cvId} onClose={() => setShowSnapshotPanel(false)} />
        </div>
      )}
    </div>
  );
}