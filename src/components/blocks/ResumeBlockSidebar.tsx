'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import type { CustomBlock } from '@/types/resume';
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
  Settings,
  EyeOff,
  Eye,
} from 'lucide-react';
import {
  BLOCK_DEFINITIONS,
  getBlocksInOrder,
  moveBlock,
  removeBlock,
  removeCustomBlock,
  toggleBlockActive,
  type BlockType,
  type BlockDirection,
} from '@/lib/resume/blockLayout';
import { useToast } from '@/components/ui/Toast';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  user: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  'file-text': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  'graduation-cap': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
  ),
  wrench: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  'folder-git2': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
  ),
  target: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  ),
  award: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
  ),
  'align-left': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
  ),
  globe: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  trophy: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polyline points="8 6 4 10 8 14"/><polyline points="16 6 20 10 16 14"/><line x1="12" y1="2" x2="12" y2="14"/><path d="M20 14h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/><path d="M4 14h2a2 2 0 0 0 2 2v2a2 2 0 0 0-2 2H4"/></svg>
  ),
  link: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  ),
};

function getIconForType(type: string) {
  const def = BLOCK_DEFINITIONS[type as BlockType];
  if (!def) return AlignLeftFallback;
  const iconFn = ICON_MAP[def.icon];
  return iconFn || AlignLeftFallback;
}

function AlignLeftFallback({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
  );
}

// Navigation-only sections that are not layout blocks
const NAV_SECTIONS = [
  { id: 'template', label: 'Template' },
  { id: 'snapshots', label: 'Snapshots' },
  { id: 'export', label: 'Export' },
] as const;

export function ResumeBlockSidebar() {
  const toast = useToast();
  const {
    activeSection,
    setActiveSection,
    generateFromBlocks,
    resumeData,
    updateResumeData,
  } = useEditorStore();

  const layout = resumeData.resumeLayout;
  const blocks = layout ? getBlocksInOrder(layout) : [];
  const customBlocks: CustomBlock[] = resumeData.customBlocks || [];

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'core' | 'custom'; id: string; label: string } | null>(null);

  // --- Core block actions ---
  const handleMoveCoreBlock = (blockId: string, direction: BlockDirection) => {
    if (!layout) return;
    const newLayout = moveBlock(layout, blockId, direction);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
  };

  const handleToggleCoreBlock = (blockId: string) => {
    if (!layout) return;
    const newLayout = toggleBlockActive(layout, blockId);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
  };

  const handleDeleteCoreBlock = (blockId: string, type: BlockType) => {
    const def = BLOCK_DEFINITIONS[type];
    setDeleteTarget({ type: 'core', id: blockId, label: def.label });
  };

  const confirmDeleteCoreBlock = () => {
    if (!deleteTarget || deleteTarget.type !== 'core' || !layout) return;
    const newLayout = removeBlock(layout, deleteTarget.id);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
    toast({ message: `${deleteTarget.label} removed`, type: 'success' });
    setDeleteTarget(null);
  };

  // --- Custom block actions ---
  const handleDeleteCustomBlock = (block: CustomBlock) => {
    setDeleteTarget({ type: 'custom', id: block.id, label: block.title });
  };

  const confirmDeleteCustomBlock = () => {
    if (!deleteTarget || deleteTarget.type !== 'custom') return;
    const newResume = removeCustomBlock(resumeData, deleteTarget.id);
    updateResumeData(() => newResume);
    toast({ message: `${deleteTarget.label} removed`, type: 'success' });
    if (activeSection === `custom-${deleteTarget.id}`) {
      setActiveSection('personal');
    }
    setDeleteTarget(null);
  };

  const activeBlocks = blocks.filter((b) => b.active);
  const inactiveBlocks = blocks.filter((b) => !b.active);

  return (
    <div className="flex flex-col h-full">
      {/* Block list */}
      <nav className="space-y-0.5 px-1 flex-1 overflow-y-auto">
        {/* Active layout blocks */}
        {activeBlocks.map((block) => {
          const def = BLOCK_DEFINITIONS[block.type];
          const label = def?.label ?? block.type;
          const Icon = getIconForType(block.type);
          const isActive = activeSection === `block-${block.id}`;

          return (
            <BlockNavItem
              key={block.id}
              icon={<Icon size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />}
              label={label}
              isActive={isActive}
              isInactive={false}
              onClick={() => setActiveSection(`block-${block.id}` as typeof activeSection)}
              onMoveUp={() => handleMoveCoreBlock(block.id, 'up')}
              onMoveDown={() => handleMoveCoreBlock(block.id, 'down')}
              onToggle={() => handleToggleCoreBlock(block.id)}
              onDelete={def?.removable ? () => handleDeleteCoreBlock(block.id, block.type) : undefined}
            />
          );
        })}

        {/* Inactive layout blocks */}
        {inactiveBlocks.length > 0 && (
          <>
            <div className="text-[9px] font-semibold text-zinc-600 uppercase tracking-wider px-3 pt-3 pb-1">
              Inactive
            </div>
            {inactiveBlocks.map((block) => {
              const def = BLOCK_DEFINITIONS[block.type];
              const label = def?.label ?? block.type;
              const Icon = getIconForType(block.type);

              return (
                <BlockNavItem
                  key={block.id}
                  icon={<Icon size={14} className="text-zinc-600" />}
                  label={label}
                  isActive={false}
                  isInactive={true}
                  onClick={() => setActiveSection(`block-${block.id}` as typeof activeSection)}
                  onMoveUp={() => handleMoveCoreBlock(block.id, 'up')}
                  onMoveDown={() => handleMoveCoreBlock(block.id, 'down')}
                  onToggle={() => handleToggleCoreBlock(block.id)}
                  onDelete={def?.removable ? () => handleDeleteCoreBlock(block.id, block.type) : undefined}
                />
              );
            })}
          </>
        )}

        {/* Custom blocks */}
        {customBlocks.map((block) => {
          const Icon = getIconForType(block.type);
          const isActive = activeSection === `custom-${block.id}`;

          return (
            <BlockNavItem
              key={block.id}
              icon={<Icon size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />}
              label={block.title}
              isActive={isActive}
              isInactive={false}
              onClick={() => setActiveSection(`custom-${block.id}` as typeof activeSection)}
              onMoveUp={undefined}
              onMoveDown={undefined}
              onToggle={undefined}
              onDelete={() => handleDeleteCustomBlock(block)}
            />
          );
        })}

        {/* Navigation sections */}
        <div className="border-t border-zinc-800 pt-2 mt-2">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.id === 'template' ? SettingsIcon : section.id === 'snapshots' ? HistoryIcon : DownloadIcon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as typeof activeSection)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-100 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />
                <span className="flex-1 text-left text-xs">{section.label}</span>
                {isActive && <ChevronRight size={12} className="text-amber-500/50" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Apply to LaTeX */}
      <div className="mt-auto border-t border-zinc-800 pt-3 px-1">
        <button
          onClick={generateFromBlocks}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Apply to LaTeX
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <h3 className="text-sm font-semibold text-zinc-100">Remove Block</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              Remove <strong className="text-zinc-200">{deleteTarget.label}</strong> from your CV?
            </p>
            <p className="text-xs text-zinc-500 mb-5">
              You can add it again from the Block Store.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteTarget.type === 'core' ? confirmDeleteCoreBlock : confirmDeleteCustomBlock}
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BlockNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isInactive: boolean;
  onClick: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
}

function BlockNavItem({ icon, label, isActive, isInactive, onClick, onMoveUp, onMoveDown, onToggle, onDelete }: BlockNavItemProps) {
  return (
    <div className={`relative group flex items-center gap-1 ${isInactive ? 'opacity-50' : ''}`}>
      <button
        onClick={onClick}
        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-100 ${
          isActive
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-left text-xs truncate">{label}</span>
        {isActive && <ChevronRight size={12} className="text-amber-500/50 shrink-0" />}
      </button>

      {/* Controls — visible on hover or if active */}
      <div className={`flex items-center gap-0.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        {onMoveUp && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Move up"
          >
            <ChevronUp size={11} />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
            title="Move down"
          >
            <ChevronDown size={11} />
          </button>
        )}
        {onToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
            title={isInactive ? 'Activate' : 'Deactivate'}
          >
            {isInactive ? <Eye size={11} /> : <EyeOff size={11} />}
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-0.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
            title="Remove"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function HistoryIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}

function DownloadIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}