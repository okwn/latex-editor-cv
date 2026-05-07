'use client';

import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/resume/editorStore';

export function AiDrawer() {
  const { aiDrawerOpen, toggleAiDrawer } = useEditorStore();

  return (
    <>
      {aiDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={toggleAiDrawer}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-700/80 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          aiDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800">
          <h2 className="font-semibold text-sm text-amber-400 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            AI Assistant
          </h2>
          <button
            onClick={toggleAiDrawer}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-zinc-500 italic">AI assistant coming soon…</p>
        </div>
      </div>
    </>
  );
}
