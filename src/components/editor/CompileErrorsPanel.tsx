'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Wand2, ExternalLink } from 'lucide-react';
import { useEditorStore, CompileError } from '@/lib/resume/editorStore';

interface CompileErrorsPanelProps {
  onJumpToLine: (line: number) => void;
}

function ErrorItem({ error, onJump, onAskAi }: { error: CompileError; onJump: () => void; onAskAi: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasRaw = !!error.raw;

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <div className="flex items-start gap-2 px-3 py-2.5 hover:bg-zinc-800/30 transition-colors">
        <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {error.line ? (
              <button
                onClick={onJump}
                className="text-xs font-mono bg-zinc-800 text-amber-400 hover:text-amber-300 hover:bg-zinc-700 px-1.5 py-0.5 rounded transition-colors"
              >
                Line {error.line}
              </button>
            ) : null}
            <span className="text-sm text-zinc-200 leading-relaxed">{error.message}</span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={onAskAi}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Wand2 size={11} />
              Ask AI to fix this
            </button>

            {hasRaw && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                Log snippet
              </button>
            )}
          </div>

          {expanded && hasRaw && (
            <div className="mt-2 p-2 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-zinc-400 whitespace-pre-wrap break-all max-h-32 overflow-auto">
              {error.raw}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CompileErrorsPanel({ onJumpToLine }: CompileErrorsPanelProps) {
  const { compileErrors, compileStatus, askAiToFix } = useEditorStore();

  if (compileStatus !== 'error') return null;

  const errorCount = compileErrors.length;

  return (
    <div className="border-t border-zinc-700/50 bg-zinc-900/80">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
        <AlertCircle size={13} className="text-red-400" />
        <span className="text-xs font-medium text-red-400">
          {errorCount} {errorCount === 1 ? 'Error' : 'Errors'} found
        </span>
        <div className="flex-1" />
        <span className="text-xs text-zinc-500">Click an error to jump to it</span>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {compileErrors.map((error, i) => (
          <ErrorItem
            key={i}
            error={error}
            onJump={() => onJumpToLine(error.line)}
            onAskAi={() => askAiToFix(error)}
          />
        ))}
      </div>
    </div>
  );
}