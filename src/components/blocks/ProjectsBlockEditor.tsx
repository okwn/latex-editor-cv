'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';

export function ProjectsBlockEditor() {
  const { resumeData, setResumeData } = useEditorStore();
  const { projects } = resumeData;

  const update = (index: number, field: string, value: string | string[] | undefined) => {
    const updated = projects.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    setResumeData({ ...resumeData, projects: updated });
  };

  const add = () => {
    setResumeData({
      ...resumeData,
      projects: [
        ...projects,
        {
          id: uuid(),
          title: '',
          yearRange: '',
          linkLabel: '',
          linkUrl: undefined,
          description: '',
          tags: [],
          priority: undefined,
        },
      ],
    });
  };

  const remove = (index: number) => {
    setResumeData({ ...resumeData, projects: projects.filter((_, i) => i !== index) });
  };

  const move = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === projects.length - 1)
    )
      return;
    const updated = [...projects];
    const target = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setResumeData({ ...resumeData, projects: updated });
  };

  return (
    <div className="space-y-4 px-1">
      {projects.map((proj, i) => (
        <div key={proj.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Project {i + 1}</span>
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

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Title</label>
              <input
                type="text"
                value={proj.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                placeholder="claude-code-snippets"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Year / Range</label>
              <input
                type="text"
                value={proj.yearRange}
                onChange={(e) => update(i, 'yearRange', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                placeholder="2025"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Link Label</label>
              <input
                type="text"
                value={proj.linkLabel}
                onChange={(e) => update(i, 'linkLabel', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                placeholder="github.com/okwn/project"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Link URL</label>
              <input
                type="text"
                value={proj.linkUrl || ''}
                onChange={(e) => update(i, 'linkUrl', e.target.value || undefined)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Description</label>
            <textarea
              value={proj.description}
              onChange={(e) => update(i, 'description', e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
              placeholder="Describe what this project does and what you built..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Tags (comma-separated)</label>
            <input
              type="text"
              value={(proj.tags || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                update(i, 'tags', tags);
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              placeholder="TypeScript, Go, Docker"
            />
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-xs"
      >
        <Plus size={12} />
        Add Project
      </button>
    </div>
  );
}