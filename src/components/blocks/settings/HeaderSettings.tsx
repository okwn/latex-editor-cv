'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { BlockConfig, HeaderSettings } from '@/types/blockLayout';
import { updateBlockSettings } from '@/lib/resume/blockLayout';

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  alignment: 'center',
  showPhone: true,
  showEmail: true,
  showGithub: true,
  showLinkedin: true,
  showWebsite: true,
  showLocation: false,
  contactLayout: 'inline',
  nameSize: 'normal',
};

interface HeaderSettingsFormProps {
  block: BlockConfig;
  onClose: () => void;
}

export function HeaderSettingsForm({ block, onClose }: HeaderSettingsFormProps) {
  const { updateResumeData } = useEditorStore();

  const currentSettings = (block.settings ?? {}) as Partial<HeaderSettings>;
  const settings: HeaderSettings = {
    ...DEFAULT_HEADER_SETTINGS,
    ...currentSettings,
  };

  const updateField = useCallback((key: keyof HeaderSettings, value: unknown) => {
    const currentLayout = useEditorStore.getState().resumeData.resumeLayout;
    if (!currentLayout) return;
    const merged = Object.assign({}, settings, { [key]: value });
    const newLayout = updateBlockSettings(currentLayout, block.id, merged as Record<string, unknown>);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
  }, [block.id, settings, updateResumeData]);

  return (
    <div className="space-y-5">
      {/* Alignment */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => updateField('alignment', opt)}
              className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                settings.alignment === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Name size */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Name Size</label>
        <div className="flex gap-1">
          {(['compact', 'normal', 'large'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => updateField('nameSize', opt)}
              className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                settings.nameSize === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Contact layout */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Contact Layout</label>
        <div className="flex gap-1">
          {(['inline', 'stacked'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => updateField('contactLayout', opt)}
              className={`flex-1 px-2 py-1.5 rounded text-xs capitalize transition-colors ${
                settings.contactLayout === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility toggles */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Show Fields</label>
        <div className="space-y-1.5">
          {([
            { key: 'showEmail', label: 'Email' },
            { key: 'showGithub', label: 'GitHub' },
            { key: 'showLinkedin', label: 'LinkedIn' },
            { key: 'showWebsite', label: 'Website' },
            { key: 'showPhone', label: 'Phone' },
            { key: 'showLocation', label: 'Location' },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(e) => updateField(key, e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500/30"
              />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}