'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import {
  ResumeLayout,
  BlockConfig,
  BlockType,
  BLOCK_DEFINITIONS,
  BlockDirection,
} from '@/types/blockLayout';
import {
  getActiveBlocksInOrder,
  moveBlock,
  toggleBlockActive,
  removeBlock,
} from '@/lib/resume/blockLayout';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function RemoveBlockModal({
  block,
  onConfirm,
  onCancel,
}: {
  block: BlockConfig;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          <h3 className="text-sm font-semibold text-zinc-100">Remove Block</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-1">
          Remove <strong className="text-zinc-200">{BLOCK_DEFINITIONS[block.type].label}</strong> from your CV?
        </p>
        <p className="text-xs text-zinc-500 mb-5">
          Your data will be preserved but the section won&apos;t appear in the PDF.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

interface BlockManagerRowProps {
  block: BlockConfig;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: BlockDirection) => void;
  onRemove: (block: BlockConfig) => void;
  onSettings: (block: BlockConfig) => void;
}

function BlockManagerRow({
  block,
  canMoveUp,
  canMoveDown,
  onToggle,
  onMove,
  onRemove,
  onSettings,
}: BlockManagerRowProps) {
  const def = BLOCK_DEFINITIONS[block.type];
  const isActive = block.active;
  const isLocked = block.locked;
  const isRemovable = def.removable && !isLocked;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md border transition-colors ${
        isActive
          ? 'border-zinc-700 bg-zinc-800/50'
          : 'border-zinc-800 bg-zinc-900/30'
      }`}
    >
      {/* Drag handle */}
      <GripVertical size={12} className="text-zinc-600 shrink-0 cursor-grab" />

      {/* Active toggle */}
      <button
        onClick={() => !isLocked && onToggle(block.id)}
        disabled={isLocked}
        className={`shrink-0 p-0.5 rounded transition-colors ${
          isLocked
            ? 'text-zinc-600 cursor-not-allowed'
            : isActive
            ? 'text-amber-400 hover:text-amber-300'
            : 'text-zinc-600 hover:text-zinc-400'
        }`}
        title={isLocked ? 'This block cannot be hidden' : isActive ? 'Hide block' : 'Show block'}
      >
        {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>

      {/* Block label */}
      <span
        className={`flex-1 text-xs truncate ${
          isActive ? 'text-zinc-200' : 'text-zinc-500'
        }`}
      >
        {def.label}
      </span>

      {/* Lock indicator */}
      {isLocked && (
        <span className="text-[10px] text-zinc-600 uppercase tracking-wide" title="Locked">lock</span>
      )}

      {/* Move controls */}
      <button
        onClick={() => onMove(block.id, 'up')}
        disabled={!canMoveUp}
        className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        title="Move up"
      >
        <ChevronUp size={12} />
      </button>
      <button
        onClick={() => onMove(block.id, 'down')}
        disabled={!canMoveDown}
        className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        title="Move down"
      >
        <ChevronDown size={12} />
      </button>

      {/* Settings */}
      <button
        onClick={() => onSettings(block)}
        className="p-0.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
        title="Settings"
      >
        <Settings size={12} />
      </button>

      {/* Remove */}
      {isRemovable ? (
        <button
          onClick={() => onRemove(block)}
          className="p-0.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
          title="Remove block"
        >
          <Trash2 size={12} />
        </button>
      ) : (
        <div className="w-3 h-3" />
      )}
    </div>
  );
}

export function BlockManager() {
  const toast = useToast();
  const { resumeData, updateResumeData } = useEditorStore();
  const layout: ResumeLayout | undefined = resumeData.resumeLayout;

  const [settingsBlock, setSettingsBlock] = useState<BlockConfig | null>(null);
  const [removeBlock_, setRemoveBlock_] = useState<BlockConfig | null>(null);

  const blocks = layout ? getActiveBlocksInOrder(layout) : [];

  const handleToggle = useCallback(
    (blockId: string) => {
      if (!layout) return;
      const block = layout.blocks.find((b) => b.id === blockId);
      if (!block || block.locked) return;

      const wasActive = block.active;
      const newLayout = toggleBlockActive(layout, blockId);
      updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));

      if (wasActive) {
        toast({ message: `${BLOCK_DEFINITIONS[block.type].label} hidden`, type: 'success' });
      } else {
        toast({ message: `${BLOCK_DEFINITIONS[block.type].label} shown`, type: 'success' });
      }
    },
    [layout, updateResumeData, toast]
  );

  const handleMove = useCallback(
    (blockId: string, direction: BlockDirection) => {
      if (!layout) return;
      const newLayout = moveBlock(layout, blockId, direction);
      updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
    },
    [layout, updateResumeData]
  );

  const handleRemove = useCallback(
    (block: BlockConfig) => {
      setRemoveBlock_(block);
    },
    []
  );

  const confirmRemove = useCallback(() => {
    if (!layout || !removeBlock_) return;
    const newLayout = removeBlock(layout, removeBlock_.id);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
    toast({ message: `${BLOCK_DEFINITIONS[removeBlock_.type].label} removed`, type: 'success' });
    setRemoveBlock_(null);
  }, [layout, removeBlock_, updateResumeData, toast]);

  const handleSettings = useCallback((block: BlockConfig) => {
    setSettingsBlock(block);
  }, []);

  if (!layout) return null;

  return (
    <>
      <div className="space-y-1.5">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Layout
          </span>
          <span className="text-[10px] text-zinc-600">
            {blocks.length} active
          </span>
        </div>

        {/* Block rows in order */}
        {[...layout.blocks]
          .sort((a, b) => a.order - b.order)
          .map((block, idx) => {
            const def = BLOCK_DEFINITIONS[block.type];
            return (
              <BlockManagerRow
                key={block.id}
                block={block}
                canMoveUp={idx > 0}
                canMoveDown={idx < layout.blocks.length - 1}
                onToggle={handleToggle}
                onMove={handleMove}
                onRemove={handleRemove}
                onSettings={handleSettings}
              />
            );
          })}
      </div>

      {/* Remove confirmation modal */}
      {removeBlock_ && (
        <RemoveBlockModal
          block={removeBlock_}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveBlock_(null)}
        />
      )}

      {/* Settings panel */}
      {settingsBlock && (
        <BlockSettingsPanel
          block={settingsBlock}
          onClose={() => setSettingsBlock(null)}
        />
      )}
    </>
  );
}