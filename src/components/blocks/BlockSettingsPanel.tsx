'use client';

import { X } from 'lucide-react';
import { BlockConfig, BlockType } from '@/types/blockLayout';
import { HeaderSettingsForm } from './settings/HeaderSettings';
import { ProjectSettingsForm } from './settings/ProjectSettings';
import { EducationSettingsForm } from './settings/EducationSettings';
import { SkillsSettingsForm } from './settings/SkillsSettings';
import { CertificationSettingsForm } from './settings/CertificationSettings';
import { SummarySettingsForm } from './settings/SummarySettings';
import { BLOCK_DEFINITIONS } from '@/types/blockLayout';

interface BlockSettingsPanelProps {
  block: BlockConfig;
  onClose: () => void;
}

export function BlockSettingsPanel({ block, onClose }: BlockSettingsPanelProps) {
  const label = BLOCK_DEFINITIONS[block.type as BlockType]?.label ?? 'Block Settings';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-100">{label}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          {block.type === 'header' && <HeaderSettingsForm block={block} onClose={onClose} />}
          {block.type === 'projects' && <ProjectSettingsForm block={block} />}
          {block.type === 'education' && <EducationSettingsForm block={block} />}
          {block.type === 'skills' && <SkillsSettingsForm block={block} />}
          {block.type === 'certifications' && <CertificationSettingsForm block={block} />}
          {block.type === 'summary' && <SummarySettingsForm block={block} />}
          {block.type === 'focusAreas' && (
            <p className="text-xs text-zinc-500">No additional settings for Focus Areas.</p>
          )}
        </div>
      </div>
    </div>
  );
}