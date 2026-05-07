'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { TopBar } from '@/components/layout/TopBar';
import { AiDrawer } from '@/components/layout/AiDrawer';
import { CollapsiblePanel } from '@/components/layout/CollapsiblePanel';
import { BlockEditorRouter } from '@/components/blocks/BlockEditorRouter';
import { CompileErrorsPanel } from '@/components/editor/CompileErrorsPanel';
import { useEditorStore } from '@/lib/resume/editorStore';
import { useKeyboardShortcuts } from '@/components/ui/useKeyboardShortcuts';
import { ToastContainer } from '@/components/ui/Toast';
import { EditorSkeleton, PdfPreviewSkeleton } from '@/components/ui/Skeletons';
import { cn } from '@/lib/utils';

const LatexEditor = dynamic(
  () => import('@/components/editor/LatexEditor').then((m) => m.LatexEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

const PdfPreviewPanel = dynamic(
  () => import('@/components/preview/PdfPreview').then((m) => m.PdfPreview),
  {
    ssr: false,
    loading: () => <PdfPreviewSkeleton />,
  }
);

export default function HomePage() {
  const bootstrap = useEditorStore((s) => s.bootstrap);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <LayoutShell>
      {/* Top bar */}
      <TopBar
        leftCollapsed={leftCollapsed}
        onToggleLeft={() => setLeftCollapsed((c) => !c)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: blocks panel */}
        <CollapsiblePanel collapsed={leftCollapsed}>
          <div className="p-3">
            <BlockEditorRouter />
          </div>
        </CollapsiblePanel>

        {/* Center: editor + errors */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <LatexEditor />
          </div>
          {/* Collapsible error panel */}
          <div
            className={cn(
              'border-t border-zinc-800 transition-all duration-200 overflow-hidden',
              errorsExpanded ? 'h-40' : 'h-9'
            )}
          >
            <button
              onClick={() => setErrorsExpanded((v) => !v)}
              className="w-full h-9 flex items-center justify-between px-3 bg-zinc-900/50 hover:bg-zinc-900 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <span>Errors</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={cn('transition-transform', errorsExpanded ? 'rotate-180' : '')}
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            {errorsExpanded && (
              <div className="h-36 overflow-auto bg-zinc-900/30">
                <CompileErrorsPanel onJumpToLine={() => {}} />
              </div>
            )}
          </div>
        </main>

        {/* Right: PDF preview */}
        <aside
          className={cn(
            'border-l border-zinc-800 flex flex-col shrink-0 bg-zinc-900/20 transition-all duration-200 overflow-hidden',
            rightCollapsed ? 'w-0' : 'w-[22rem]'
          )}
        >
          <div className="w-[22rem] h-full flex flex-col">
            {/* Preview header + controls */}
            <div className="flex items-center justify-between px-3 h-9 border-b border-zinc-800/50 shrink-0">
              <span className="text-xs text-zinc-500 font-medium">Preview</span>
              <button
                onClick={() => setRightCollapsed((c) => !c)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                title={rightCollapsed ? 'Show preview' : 'Hide preview'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PdfPreviewPanel />
            </div>
          </div>
        </aside>
      </div>

      <AiDrawer />
      <ToastContainer />
    </LayoutShell>
  );
}
