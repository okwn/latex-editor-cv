'use client';

import { useCallback } from 'react';
import { SummarySettings, SummaryAlignment, SummarySpacing } from '@/types/blockLayout';
import { updateBlockSettingsInResume } from '@/lib/resume/blockLayoutUtils';
import { useEditorStore } from '@/lib/resume/editorStore';
import type { BlockConfig } from '@/types/blockLayout';

interface Props { block: BlockConfig; }

export function SummarySettingsForm({ block }: Props) {
  const { resumeData, updateResumeData } = useEditorStore();
  const settings = (block.settings as unknown as SummarySettings) || { alignment: 'left', spacing: 'normal' };

  const handleChange = useCallback(
    (key: keyof SummarySettings, value: unknown) => {
      const next = { ...settings, [key]: value };
      const newResume = updateBlockSettingsInResume(resumeData, block.id, next);
      updateResumeData(() => newResume);
    },
    [resumeData, updateResumeData, block.id, settings]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'justified'] as SummaryAlignment[]).map((opt) => (
            <button
              key={opt}
              onClick={() => handleChange('alignment', opt)}
              className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                settings.alignment === opt ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Spacing</label>
        <div className="flex gap-1">
          {(['compact', 'normal', 'relaxed'] as SummarySpacing[]).map((s) => (
            <button
              key={s}
              onClick={() => handleChange('spacing', s)}
              className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                settings.spacing === s ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}