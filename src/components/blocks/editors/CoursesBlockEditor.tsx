'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import type { CustomBlock } from '@/types/resume';
import { updateCustomBlock } from '@/lib/resume/blockLayout';
import { Plus, Trash2 } from 'lucide-react';

interface CourseItem { name: string; issuer?: string; year?: string; url?: string }

export function CoursesBlockEditor({ blockId }: { blockId: string }) {
  const { resumeData, updateResumeData } = useEditorStore();
  const block = resumeData.customBlocks?.find((b) => b.id === blockId) as CustomBlock | undefined;
  if (!block || block.type !== 'courses') return null;

  const items = (block as { items: CourseItem[] }).items;

  const handleTitleChange = (title: string) => {
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { title }));
  };

  const handleItemChange = (idx: number, field: keyof CourseItem, value: string) => {
    const newItems = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { items: newItems }));
  };

  const handleAdd = () => {
    const newItems = [...items, { name: '', issuer: '', year: '', url: '' }];
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
      <div className="space-y-3">
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Courses</label>
        {items.length === 0 && (
          <p className="text-xs text-zinc-500 italic mb-2">This block is added but empty. Add your first course.</p>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-medium">Course {idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => handleRemove(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            <input type="text" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
              placeholder="Course name" className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={item.issuer ?? ''} onChange={(e) => handleItemChange(idx, 'issuer', e.target.value)}
                placeholder="Issuer (e.g. Coursera)" className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600" />
              <input type="text" value={item.year ?? ''} onChange={(e) => handleItemChange(idx, 'year', e.target.value)}
                placeholder="Year" className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600" />
            </div>
          </div>
        ))}
        <button onClick={handleAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
          <Plus size={12} /> Add Course
        </button>
      </div>
    </div>
  );
}