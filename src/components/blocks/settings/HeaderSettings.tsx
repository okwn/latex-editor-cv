'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { BlockConfig, HeaderSettings } from '@/types/blockLayout';
import { updateBlockSettingsInResume } from '@/lib/resume/blockLayoutUtils';
import { useEditorStore } from '@/lib/resume/editorStore';

interface HeaderSettingsProps {
  block: BlockConfig;
  onClose: () => void;
}

export function HeaderSettingsForm({ block, onClose }: HeaderSettingsProps) {
  const toast = useToast();
  const { resumeData, updateResumeData } = useEditorStore();
  const settings = (block.settings as unknown as HeaderSettings) || {
    alignment: 'center',
    showPhone: true,
    showEmail: true,
    showGithub: true,
    showLinkedin: true,
    showWebsite: true,
    nameSize: 'normal',
  };

  const handleChange = useCallback(
    (key: keyof HeaderSettings, value: unknown) => {
      const next = { ...settings, [key]: value };
      const newResume = updateBlockSettingsInResume(resumeData, block.id, next);
      updateResumeData(() => newResume);
    },
    [resumeData, updateResumeData, block.id, settings]
  );

  return (
    <div className="space-y-4">
      {/* Alignment */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleChange('alignment', opt)}
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
              onClick={() => handleChange('nameSize', opt)}
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

      {/* Visibility toggles */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">Show Fields</label>
        <div className="space-y-1.5">
          {[
            { key: 'showEmail', label: 'Email' },
            { key: 'showGithub', label: 'GitHub' },
            { key: 'showLinkedin', label: 'LinkedIn' },
            { key: 'showWebsite', label: 'Website' },
            { key: 'showPhone', label: 'Phone' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={Boolean(settings[key as keyof HeaderSettings])}
                onChange={(e) => handleChange(key as keyof HeaderSettings, e.target.checked)}
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