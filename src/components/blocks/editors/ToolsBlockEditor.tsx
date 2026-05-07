'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import type { CustomBlock } from '@/types/resume';
import { updateCustomBlock } from '@/lib/resume/blockLayout';
import { Plus, Trash2 } from 'lucide-react';

export function ToolsBlockEditor({ blockId }: { blockId: string }) {
  const { resumeData, updateResumeData } = useEditorStore();
  const block = resumeData.customBlocks?.find((b) => b.id === blockId) as CustomBlock | undefined;
  if (!block || block.type !== 'tools') return null;

  const items = (block as { items: string[] }).items;

  const handleTitleChange = (title: string) => {
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { title }));
  };

  const handleItemChange = (idx: number, value: string) => {
    const newItems = items.map((item, i) => i === idx ? value : item);
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items: newItems }));
  };

  const handleAdd = () => {
    const newItems = [...items, ''];
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items: newItems }));
  };

  const handleRemove = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items: newItems }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Section Title</label>
        <input type="text" value={block.title} onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600" />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Tools</label>
        {items.length === 0 && (
          <p className="text-xs text-zinc-500 italic mb-2">This block is added but empty. Add your first tool.</p>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input type="text" value={item} onChange={(e) => handleItemChange(idx, e.target.value)}
              placeholder="Docker, Kubernetes, Terraform..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600" />
            {items.length > 1 && (
              <button onClick={() => handleRemove(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
          <Plus size={12} /> Add Tool
        </button>
      </div>
    </div>
  );
}