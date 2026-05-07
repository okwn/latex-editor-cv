'use client';

import { useEditorStore } from '@/lib/resume/editorStore';

export function SummaryBlockEditor() {
  const { resumeData, setResumeData } = useEditorStore();
  const { summary } = resumeData;

  const update = (field: 'professionalSummary', value: string) => {
    setResumeData({ ...resumeData, summary: { ...summary, [field]: value } });
  };

  return (
    <div className="space-y-4 px-1">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Professional Summary</label>
        <p className="text-xs text-zinc-500">A 2-3 sentence overview of your background and key strengths.</p>
        <textarea
          value={summary.professionalSummary}
          onChange={(e) => update('professionalSummary', e.target.value)}
          rows={5}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none leading-relaxed"
          placeholder="Fifteen years of experience across multiple technologies..."
        />
      </div>
    </div>
  );
}