'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';

export function SkillsBlockEditor() {
  const { updateResumeData } = useEditorStore();
  const skillGroups = useEditorStore((s) => s.resumeData.skillGroups ?? []);

  const update = (index: number, field: string, value: string) => {
    updateResumeData((prev) => ({
      ...prev,
      skillGroups: (prev.skillGroups ?? []).map((g, i) =>
        i === index ? { ...g, [field]: value } : g
      ),
    }));
  };

  const updateSkills = (index: number, skills: string) => {
    const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
    updateResumeData((prev) => ({
      ...prev,
      skillGroups: (prev.skillGroups ?? []).map((g, i) =>
        i === index ? { ...g, skills: skillList } : g
      ),
    }));
  };

  const add = () => {
    updateResumeData((prev) => ({
      ...prev,
      skillGroups: [
        ...(prev.skillGroups ?? []),
        { id: uuid(), groupName: '', skills: [] },
      ],
    }));
  };

  const remove = (index: number) => {
    updateResumeData((prev) => ({
      ...prev,
      skillGroups: (prev.skillGroups ?? []).filter((_, i) => i !== index),
    }));
  };

  const move = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === skillGroups.length - 1)
    )
      return;
    updateResumeData((prev) => {
      const arr = [...(prev.skillGroups ?? [])];
      const target = direction === 'up' ? index - 1 : index + 1;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, skillGroups: arr };
    });
  };

  return (
    <div className="space-y-4 px-1">
      {skillGroups.map((group, i) => (
        <div key={group.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Group {i + 1}</span>
            <div className="flex items-center gap-1">
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Category</label>
            <input
              type="text"
              value={group.groupName}
              onChange={(e) => update(i, 'groupName', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Backend"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Skills (comma-separated)</label>
            <input
              type="text"
              value={group.skills.join(', ')}
              onChange={(e) => updateSkills(i, e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Go, Python, PostgreSQL"
            />
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-xs"
      >
        <Plus size={12} />
        Add Skill Group
      </button>
    </div>
  );
}
