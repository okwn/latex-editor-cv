'use client';

import { useState, useCallback } from 'react';
import type { AiResponse } from '@/lib/ai/aiPatchSchema';
import type { Resume } from '@/types/resume';
import { computePatchDiffs, describePatchPath, applyValidatedPatches, type PatchDiff } from '@/lib/resume/jsonPatch';
import { useEditorStore } from '@/lib/resume/editorStore';

interface AiPatchPreviewProps {
  response: AiResponse;
  onDismiss: () => void;
}

interface DiffItemProps {
  diff: PatchDiff;
  resumeData: Resume;
  selected: boolean;
  onToggle: () => void;
}

function DiffItem({ diff, resumeData, selected, onToggle }: DiffItemProps) {
  const { patch, before, after } = diff;
  const description = describePatchPath(resumeData, patch);
  const isAdd = patch.op === 'add';
  const isRemove = patch.op === 'remove';
  const isReplace = patch.op === 'replace';

  const beforeStr = before !== undefined ? JSON.stringify(before, null, 2) : '—';
  const afterStr = after !== undefined ? JSON.stringify(after, null, 2) : '—';

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        selected
          ? 'bg-green-500/5 border-green-500/30'
          : 'bg-zinc-800/50 border-zinc-700/50'
      }`}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500/30 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              isReplace ? 'bg-blue-500/20 text-blue-400' :
              isAdd ? 'bg-green-500/20 text-green-400' :
              isRemove ? 'bg-red-500/20 text-red-400' :
              'bg-zinc-700 text-zinc-300'
            }`}>
              {patch.op.toUpperCase()}
            </span>
            <span className="text-xs text-zinc-300 font-medium">{description}</span>
            <code className="text-xs text-zinc-500 truncate">{patch.path}</code>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-zinc-900/60">
              <div className="text-zinc-500 mb-1">Before</div>
              <pre className="text-zinc-400 whitespace-pre-wrap break-words max-h-20 overflow-y-auto">
                {isRemove ? beforeStr : isAdd ? '—' : beforeStr}
              </pre>
            </div>
            <div className="p-2 rounded bg-zinc-900/60">
              <div className="text-zinc-500 mb-1">After</div>
              <pre className="text-zinc-300 whitespace-pre-wrap break-words max-h-20 overflow-y-auto">
                {isRemove ? '—' : afterStr}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiPatchPreview({ response, onDismiss }: AiPatchPreviewProps) {
  const { resumeData, setResumeData, generateFromBlocks, compile, compileStatus } = useEditorStore();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(response.patches.map((_, i) => i))
  );
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const diffs = computePatchDiffs(resumeData, response.patches);

  const toggleIndex = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleApplySelected = useCallback(async () => {
    setApplyError(null);
    setIsApplying(true);

    const selected = Array.from(selectedIndices);
    const result = applyValidatedPatches(resumeData, response.patches, selected);

    if (!result.success || !result.data) {
      setApplyError(result.errors[0] || 'Failed to apply patches');
      setIsApplying(false);
      return;
    }

    setResumeData(result.data);
    generateFromBlocks();

    // Auto-compile if enabled — check localStorage
    const autoCompile = localStorage.getItem('kcv-auto-compile') === 'true';
    if (autoCompile && compileStatus !== 'compiling') {
      await compile();
    }

    setIsApplying(false);
    onDismiss();
  }, [selectedIndices, resumeData, response.patches, setResumeData, generateFromBlocks, compile, compileStatus, onDismiss]);

  const _handleApplyAll = useCallback(async () => {
    setSelectedIndices(new Set(response.patches.map((_, i) => i)));
    const result = applyValidatedPatches(resumeData, response.patches);

    if (!result.success || !result.data) {
      setApplyError(result.errors[0] || 'Failed to apply patches');
      return;
    }

    setResumeData(result.data);
    generateFromBlocks();

    const autoCompile = localStorage.getItem('kcv-auto-compile') === 'true';
    if (autoCompile && compileStatus !== 'compiling') {
      await compile();
    }

    onDismiss();
  }, [resumeData, response.patches, setResumeData, generateFromBlocks, compile, compileStatus, onDismiss]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-green-400">
            {response.patches.length} change{response.patches.length !== 1 ? 's' : ''} suggested
          </div>
          {response.warnings && response.warnings.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {response.warnings.map((w, i) => (
                <div key={i} className="text-xs text-amber-400/80 flex items-start gap-1">
                  <span>⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
          >
            Dismiss All
          </button>
        </div>
      </div>

      {/* Auto-compile notice */}
      {localStorage.getItem('kcv-auto-compile') === 'true' && (
        <div className="text-xs text-zinc-500 flex items-center gap-1">
          <span>⟳</span> Auto-compile enabled — PDF will refresh after applying
        </div>
      )}

      {/* Diff list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {diffs.map((diff, index) => (
          <DiffItem
            key={index}
            diff={diff}
            resumeData={resumeData}
            selected={selectedIndices.has(index)}
            onToggle={() => toggleIndex(index)}
          />
        ))}
      </div>

      {/* Error */}
      {applyError && (
        <div className="text-xs text-red-400 p-2 rounded bg-red-500/10 border border-red-500/20">
          {applyError}
        </div>
      )}

      {/* Apply controls */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50">
        <div className="text-xs text-zinc-500">
          {selectedIndices.size} of {response.patches.length} selected
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApplySelected}
            disabled={isApplying || selectedIndices.size === 0}
            className="text-xs px-3 py-1.5 rounded bg-green-600/30 text-green-400 hover:bg-green-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isApplying ? 'Applying...' : `Apply Selected (${selectedIndices.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
