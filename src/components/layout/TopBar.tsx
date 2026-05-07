'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/resume/editorStore';
import { useToast } from '@/components/ui/Toast';
import { createSnapshot } from '@/lib/resume/persistence';
import {
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Keyboard,
  Play,
} from 'lucide-react';

export function TopBar({
  leftCollapsed,
  onToggleLeft,
}: {
  leftCollapsed: boolean;
  onToggleLeft: () => void;
}) {
  const toast = useToast();
  const {
    compile,
    compileStatus,
    latexSource,
    currentTemplateId,
    resumeData,
    toggleAiDrawer,
    generateFromBlocks,
  } = useEditorStore();

  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleSnapshot = useCallback(() => {
    if (!latexSource) return;
    createSnapshot(resumeData, latexSource, currentTemplateId);
    toast({ message: 'Snapshot saved', type: 'success' });
  }, [resumeData, latexSource, currentTemplateId, toast]);

  const handleCompile = useCallback(async () => {
    if (compileStatus === 'compiling' || !latexSource) return;
    await compile();
    const status = useEditorStore.getState().compileStatus;
    if (status === 'success') {
      toast({ message: 'PDF compiled successfully', type: 'success' });
    } else if (status === 'error') {
      toast({ message: 'Compilation failed', type: 'error' });
    }
  }, [compile, compileStatus, latexSource, toast]);

  const statusConfig = {
    idle: { dot: 'bg-zinc-600', label: 'Ready', color: 'text-zinc-500' },
    compiling: { dot: 'bg-amber-400 animate-pulse', label: 'Compiling…', color: 'text-amber-400' },
    success: { dot: 'bg-green-400', label: 'Compiled', color: 'text-green-400' },
    error: { dot: 'bg-red-400', label: 'Error', color: 'text-red-400' },
  };
  const sc = statusConfig[compileStatus];

  return (
    <>
      <header className="h-12 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm flex items-center px-3 gap-3 shrink-0 z-30">
        {/* Left controls */}
        <button
          onClick={onToggleLeft}
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title={leftCollapsed ? 'Show blocks panel' : 'Hide blocks panel'}
        >
          {leftCollapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
        </button>

        <div className="w-px h-5 bg-zinc-700" />

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-zinc-900">K</span>
          </div>
          <span className="font-semibold text-sm tracking-tight hidden sm:block">CV-Maker</span>
        </div>

        <div className="w-px h-5 bg-zinc-700" />

        {/* Main actions */}
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={generateFromBlocks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-xs"
            title="Generate LaTeX from blocks"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span className="hidden md:inline">Generate</span>
          </button>

          <button
            onClick={handleCompile}
            disabled={compileStatus === 'compiling' || !latexSource}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
            title="Compile PDF (⌘↵)"
          >
            <Play size={11} />
            <span className="hidden md:inline">{compileStatus === 'compiling' ? 'Compiling…' : 'Compile'}</span>
          </button>

          <button
            onClick={handleSnapshot}
            disabled={!latexSource}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
            title="Save snapshot (⌘S)"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="hidden md:inline">Snapshot</span>
          </button>

          <button
            onClick={generateFromBlocks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs md:hidden"
            title="Apply to LaTeX"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>
        </div>

        {/* Status + right controls */}
        <div className="flex items-center gap-2">
          {/* Compile status */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
            <span className={cn('text-xs', sc.color)}>{sc.label}</span>
          </div>

          <button
            onClick={toggleAiDrawer}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
            title="AI Assistant (⌘J)"
          >
            <Sparkles size={14} />
          </button>

          <button
            onClick={() => setShowShortcuts((v) => !v)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              showShortcuts
                ? 'bg-zinc-700 text-zinc-200'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
            title="Keyboard shortcuts"
          >
            <Keyboard size={14} />
          </button>
        </div>
      </header>

      {/* Shortcuts popover */}
      {showShortcuts && (
        <div className="absolute top-14 right-4 z-[60] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 text-xs w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-200">Keyboard Shortcuts</h3>
            <button onClick={() => setShowShortcuts(false)} className="text-zinc-500 hover:text-zinc-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {[
              { keys: ['⌘', 'S'], action: 'Save snapshot' },
              { keys: ['⌘', '↵'], action: 'Compile' },
              { keys: ['⌘', 'B'], action: 'Toggle blocks' },
              { keys: ['⌘', 'J'], action: 'Toggle AI drawer' },
            ].map(({ keys, action }) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-zinc-400">{action}</span>
                <div className="flex items-center gap-0.5">
                  {keys.map((k) => (
                    <kbd key={k} className="kbd">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
