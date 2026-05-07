'use client';

import { useCallback } from 'react';
import { ProjectSettings, CardSize, ProjectColumns, ProjectSpacing } from '@/types/blockLayout';
import { updateBlockSettingsInResume } from '@/lib/resume/blockLayoutUtils';
import { useEditorStore } from '@/lib/resume/editorStore';
import type { BlockConfig } from '@/types/blockLayout';

interface ProjectSettingsProps {
  block: BlockConfig;
}

export function ProjectSettingsForm({ block }: ProjectSettingsProps) {
  const { resumeData, updateResumeData } = useEditorStore();
  const settings = (block.settings as unknown as ProjectSettings) || {
    columns: 2,
    cardSize: 'normal',
    showLinks: true,
    showTags: true,
    maxProjects: undefined,
    spacing: 'normal',
  };

  const handleChange = useCallback(
    (key: keyof ProjectSettings, value: unknown) => {
      const next = { ...settings, [key]: value };
      const newResume = updateBlockSettingsInResume(resumeData, block.id, next);
      updateResumeData(() => newResume);
    },
    [resumeData, updateResumeData, block.id, settings]
  );

  return (
    <div className="space-y-4">
      {/* Columns */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Columns</label>
        <div className="flex gap-1">
          {([1, 2, 3] as ProjectColumns[]).map((n) => (
            <button
              key={n}
              onClick={() => handleChange('columns', n)}
              className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
                settings.columns === n ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Card size */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Card Size</label>
        <div className="flex gap-1">
          {(['compact', 'normal', 'large'] as CardSize[]).map((s) => (
            <button
              key={s}
              onClick={() => handleChange('cardSize', s)}
              className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                settings.cardSize === s ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Spacing</label>
        <div className="flex gap-1">
          {(['compact', 'normal', 'relaxed'] as ProjectSpacing[]).map((s) => (
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

      {/* Max projects */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Max Projects (optional)</label>
        <input
          type="number"
          min={1}
          max={20}
          placeholder="No limit"
          value={settings.maxProjects ?? ''}
          onChange={(e) =>
            handleChange(
              'maxProjects',
              e.target.value ? parseInt(e.target.value, 10) : undefined
            )
          }
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-1.5">
        {[
          { key: 'showLinks', label: 'Show project links' },
          { key: 'showTags', label: 'Show tags' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={Boolean(settings[key as keyof ProjectSettings])}
              onChange={(e) => handleChange(key as keyof ProjectSettings, e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-500"
            />
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}