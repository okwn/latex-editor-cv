'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export function FocusAreasBlockEditor() {
  const { resumeData, setResumeData } = useEditorStore();
  const { focusAreas } = resumeData;

  const update = (index: number, value: string) => {
    const updated = focusAreas.map((item, i) => (i === index ? value : item));
    setResumeData({ ...resumeData, focusAreas: updated });
  };

  const add = () => {
    setResumeData({ ...resumeData, focusAreas: [...focusAreas, ''] });
  };

  const remove = (index: number) => {
    setResumeData({ ...resumeData, focusAreas: focusAreas.filter((_, i) => i !== index) });
  };

  const move = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === focusAreas.length - 1)
    )
      return;
    const updated = [...focusAreas];
    const target = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setResumeData({ ...resumeData, focusAreas: updated });
  };

  return (
    <div className="space-y-4 px-1">
      <p className="text-xs text-zinc-500">Define your key areas of focus and expertise. These appear as a bullet list in the CV.</p>

      {focusAreas.map((area, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={area}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            placeholder="Architecting reliable, observable systems at scale"
          />
          <button onClick={() => move(i, 'up')} className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300">
            <ChevronUp size={12} />
          </button>
          <button onClick={() => move(i, 'down')} className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300">
            <ChevronDown size={12} />
          </button>
          <button onClick={() => remove(i)} className="p-1 rounded hover:bg-zinc-700 text-red-400/70 hover:text-red-400">
            <Trash2 size={12} />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-xs"
      >
        <Plus size={12} />
        Add Focus Area
      </button>
    </div>
  );
}