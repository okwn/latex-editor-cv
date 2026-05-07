'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import type { CustomBlock } from '@/types/resume';
import { updateCustomBlock } from '@/lib/resume/blockLayout';
import { Plus, Trash2 } from 'lucide-react';

export function CustomTextBlockEditor({ blockId }: { blockId: string }) {
  const { resumeData, updateResumeData } = useEditorStore();
  const block = resumeData.customBlocks?.find((b) => b.id === blockId) as CustomBlock | undefined;
  if (!block || block.type !== 'customText') return null;

  const handleTitleChange = (title: string) => {
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { title }));
  };

  const handleParagraphChange = (index: number, value: string) => {
    const paragraphs = [...block.paragraphs];
    paragraphs[index] = value;
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { paragraphs }));
  };

  const handleAddParagraph = () => {
    const paragraphs = [...block.paragraphs, ''];
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { paragraphs }));
  };

  const handleRemoveParagraph = (index: number) => {
    const paragraphs = block.paragraphs.filter((_, i) => i !== index);
    updateResumeData((prev) => updateCustomBlock(prev, blockId, { paragraphs }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Section Title</label>
        <input
          type="text"
          value={block.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
          placeholder="Section title"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Paragraphs</label>
        {block.paragraphs.map((p, idx) => (
          <div key={idx} className="flex gap-2">
            <textarea
              value={p}
              onChange={(e) => handleParagraphChange(idx, e.target.value)}
              rows={3}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
              placeholder="Enter text..."
            />
            {block.paragraphs.length > 1 && (
              <button
                onClick={() => handleRemoveParagraph(idx)}
                className="p-1 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddParagraph}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
        >
          <Plus size={12} /> Add Paragraph
        </button>
      </div>
    </div>
  );
}