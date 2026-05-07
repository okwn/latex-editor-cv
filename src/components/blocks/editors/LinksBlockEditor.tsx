'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import type { CustomBlock } from '@/types/resume';
import { updateCustomBlock } from '@/lib/resume/blockLayout';
import { Plus, Trash2 } from 'lucide-react';

export function LinksBlockEditor({ blockId }: { blockId: string }) {
  const { resumeData, updateResumeData } = useEditorStore();
  const block = resumeData.customBlocks?.find((b) => b.id === blockId) as CustomBlock | undefined;
  if (!block || block.type !== 'links') return null;

  const handleTitleChange = (title: string) => {
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { title }));
  };

  const handleItemChange = (idx: number, field: 'label' | 'url', value: string) => {
    const items = block.items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items }));
  };

  const handleAdd = () => {
    const items = [...block.items, { label: '', url: '' }];
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items }));
  };

  const handleRemove = (idx: number) => {
    const items = block.items.filter((_, i) => i !== idx);
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Section Title</label>
        <input type="text" value={block.title} onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600" />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Links</label>
        {block.items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input type="text" value={item.label} onChange={(e) => handleItemChange(idx, 'label', e.target.value)}
              placeholder="Label" className="w-28 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600" />
            <input type="url" value={item.url} onChange={(e) => handleItemChange(idx, 'url', e.target.value)}
              placeholder="https://..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600" />
            {block.items.length > 1 && (
              <button onClick={() => handleRemove(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
          <Plus size={12} /> Add Link
        </button>
      </div>
    </div>
  );
}