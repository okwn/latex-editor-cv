'use client';

import { useCallback, useState, useMemo } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import {
  BlockType,
  BLOCK_DEFINITIONS,
  CustomBlockType,
  getBlockStoreStatus,
  addBlock,
  toggleBlockActive,
  addCustomBlock,
} from '@/lib/resume/blockLayout';
import { useToast } from '@/components/ui/Toast';
import { X, Plus, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'all' | 'core' | 'career' | 'skills' | 'portfolio' | 'credentials' | 'extra';

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  core: 'Core',
  career: 'Career',
  skills: 'Skills',
  portfolio: 'Portfolio',
  credentials: 'Credentials',
  extra: 'Extra',
};

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
  briefcase: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  ),
  'book-open': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  ),
  heart: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  ),
  tool: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  users: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  mic: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
  ),
  code: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  ),
  'bar-chart': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
  ),
  book: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  ),
  'file-sign': ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
  ),
  quote: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>
  ),
  star: ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
};

interface BlockCardProps {
  type: BlockType;
  status: 'add' | 'added' | 'activate' | 'coming-soon';
  onAdd: () => void;
  onActivate: () => void;
}

function BlockCard({ type, status, onAdd, onActivate }: BlockCardProps) {
  const def = BLOCK_DEFINITIONS[type];
  const rawIcon = ICON_MAP[def.icon];
  const Icon = rawIcon as (props: { size: number; className?: string }) => React.ReactElement;

  const isComingSoon = status === 'coming-soon';
  const isAdded = status === 'added';
  const isActivate = status === 'activate';

  return (
    <div className={cn(
      'rounded-lg border p-3 transition-colors',
      isComingSoon
        ? 'border-zinc-800 bg-zinc-900/50 opacity-60'
        : isAdded
        ? 'border-zinc-700 bg-zinc-800/50'
        : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
    )}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 text-zinc-400 shrink-0">
          {Icon({ size: 16, className: '' })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-zinc-200">{def.label}</span>
            {isComingSoon && (
              <span className="text-[9px] font-medium text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">Coming soon</span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{def.description}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        {isComingSoon ? (
          <span className="text-[10px] text-zinc-600 italic">Not yet available</span>
        ) : isAdded ? (
          <span className="flex items-center gap-1 px-2 py-1 text-[10px] text-zinc-500">
            <Check size={10} /> Added
          </span>
        ) : isActivate ? (
          <button
            onClick={onActivate}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Check size={10} />
            Activate
          </button>
        ) : (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Plus size={10} /> Add
          </button>
        )}
      </div>
    </div>
  );
}

interface BlockStorePanelProps {
  onClose?: () => void;
  onAddBlock?: (blockId: string, blockType: CustomBlockType) => void;
}

export function BlockStorePanel({ onClose, onAddBlock }: BlockStorePanelProps) {
  const toast = useToast();
  const { resumeData, updateResumeData } = useEditorStore();
  const layout = resumeData.resumeLayout;

  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');

  const allBlockTypes = useMemo(() => Object.keys(BLOCK_DEFINITIONS) as BlockType[], []);

  const filteredBlockTypes = useMemo(() => {
    return allBlockTypes.filter((type) => {
      const def = BLOCK_DEFINITIONS[type];
      const matchesCategory = activeCategory === 'all' || def.category === activeCategory;
      const matchesSearch = !search || def.label.toLowerCase().includes(search.toLowerCase()) || def.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allBlockTypes, activeCategory, search]);

  const handleAddCoreBlock = useCallback((type: BlockType) => {
    if (!layout) return;
    const def = BLOCK_DEFINITIONS[type];
    const existing = layout.blocks.find((b) => b.type === type);
    if (existing) {
      if (existing.active) return;
      const newLayout = toggleBlockActive(layout, existing.id);
      updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
      toast({ message: `${def.label} activated`, type: 'success' });
      return;
    }
    const newLayout = addBlock(layout, type);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
    toast({ message: `${def.label} added`, type: 'success' });
  }, [layout, updateResumeData, toast]);

  const handleActivateCoreBlock = useCallback((type: BlockType) => {
    if (!layout) return;
    const block = layout.blocks.find((b) => b.type === type);
    if (!block || block.active) return;
    const newLayout = toggleBlockActive(layout, block.id);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
    const def = BLOCK_DEFINITIONS[type];
    toast({ message: `${def.label} activated`, type: 'success' });
  }, [layout, updateResumeData, toast]);

  const handleAddCustomBlock = useCallback((type: CustomBlockType) => {
    const def = BLOCK_DEFINITIONS[type];
    if (def.unique) {
      const exists = (resumeData.customBlocks || []).some((b) => b.type === type);
      if (exists) {
        toast({ message: `${def.label} already exists`, type: 'warning' });
        return;
      }
    }
    const newResume = addCustomBlock(resumeData, type);
    updateResumeData(() => newResume);
    toast({ message: `${def.label} added`, type: 'success' });
    if (onAddBlock) {
      const order = newResume.resumeLayout?.customBlocksOrder || [];
      const lastId = order[order.length - 1];
      if (lastId) onAddBlock(lastId, type);
    }
  }, [resumeData, updateResumeData, toast, onAddBlock]);

  const categories: Category[] = ['all', 'core', 'career', 'skills', 'portfolio', 'credentials', 'extra'];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <span className="text-xs font-semibold text-zinc-200">Block Store</span>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blocks..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md pl-7 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'shrink-0 px-2 py-1 rounded text-[10px] font-medium transition-colors',
              activeCategory === cat
                ? 'bg-zinc-700 text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1.5">
          {filteredBlockTypes.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">No blocks found</p>
          )}
          {filteredBlockTypes.map((type) => {
            const status = getBlockStoreStatus(resumeData, type);
            return (
              <BlockCard
                key={type}
                type={type}
                status={status}
                onAdd={() => {
                  const def = BLOCK_DEFINITIONS[type];
                  if (def.supported) {
                    if (['header', 'summary', 'education', 'skills', 'projects', 'focusAreas', 'certifications'].includes(type)) {
                      handleAddCoreBlock(type);
                    } else {
                      handleAddCustomBlock(type as CustomBlockType);
                    }
                  }
                }}
                onActivate={() => handleActivateCoreBlock(type)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}