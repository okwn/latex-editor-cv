'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';

export function EducationBlockEditor() {
  const { resumeData, setResumeData } = useEditorStore();
  const { education } = resumeData;

  const update = (index: number, field: string, value: string) => {
    const updated = education.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setResumeData({ ...resumeData, education: updated });
  };

  const add = () => {
    setResumeData({
      ...resumeData,
      education: [
        ...education,
        {
          id: uuid(),
          degree: '',
          institution: '',
          city: '',
          startYear: '',
          endYear: '',
          status: undefined,
        },
      ],
    });
  };

  const remove = (index: number) => {
    setResumeData({ ...resumeData, education: education.filter((_, i) => i !== index) });
  };

  const move = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === education.length - 1)
    )
      return;
    const updated = [...education];
    const target = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setResumeData({ ...resumeData, education: updated });
  };

  return (
    <div className="space-y-4 px-1">
      {education.map((edu, i) => (
        <div key={edu.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Entry {i + 1}</span>
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
            <label className="text-xs text-zinc-500">Degree</label>
            <input
              type="text"
              value={edu.degree}
              onChange={(e) => update(i, 'degree', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Computer Science & Engineering"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">Institution</label>
            <input
              type="text"
              value={edu.institution}
              onChange={(e) => update(i, 'institution', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Bahçeşehir University"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">Start Year</label>
              <input
                type="text"
                value={edu.startYear}
                onChange={(e) => update(i, 'startYear', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                placeholder="2009"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">End Year</label>
              <input
                type="text"
                value={edu.endYear}
                onChange={(e) => update(i, 'endYear', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                placeholder="2014"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">City</label>
            <input
              type="text"
              value={edu.city}
              onChange={(e) => update(i, 'city', e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Istanbul"
            />
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-xs"
      >
        <Plus size={12} />
        Add Education
      </button>
    </div>
  );
}