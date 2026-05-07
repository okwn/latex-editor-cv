'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import type { CustomBlock } from '@/types/resume';
import {
  User,
  FileText,
  GraduationCap,
  Wrench,
  FolderGit2,
  Target,
  Award,
  ChevronRight,
  History,
  Download,
  AlignLeft,
  Globe,
  Trophy,
  Link,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { removeCustomBlock } from '@/lib/resume/blockLayout';
import { useToast } from '@/components/ui/Toast';

const sectionConfig: {
  id: 'personal' | 'summary' | 'education' | 'skills' | 'projects' | 'focusAreas' | 'certifications' | 'template' | 'snapshots' | 'export';
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}[] = [
  { id: 'personal', label: 'Header', icon: User },
  { id: 'summary', label: 'Professional Summary', icon: FileText },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Technical Skills', icon: Wrench },
  { id: 'projects', label: 'Selected Projects', icon: FolderGit2 },
  { id: 'focusAreas', label: 'Focus Areas', icon: Target },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'template', label: 'Template', icon: History },
  { id: 'snapshots', label: 'Snapshots', icon: History },
  { id: 'export', label: 'Export', icon: Download },
];

const CUSTOM_ICON_MAP: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  customText: AlignLeft,
  languages: Globe,
  awards: Trophy,
  links: Link,
};

export function ResumeBlockSidebar() {
  const toast = useToast();
  const { activeSection, setActiveSection, generateFromBlocks, resumeData, updateResumeData } = useEditorStore();

  const [deleteTarget, setDeleteTarget] = useState<CustomBlock | null>(null);

  const customBlocks: CustomBlock[] = resumeData.customBlocks || [];

  const handleDeleteCustomBlock = (block: CustomBlock) => {
    setDeleteTarget(block);
  };

  const confirmDeleteCustomBlock = () => {
    if (!deleteTarget) return;
    const newResume = removeCustomBlock(resumeData, deleteTarget.id);
    updateResumeData(() => newResume);
    toast({ message: `${deleteTarget.title} removed`, type: 'success' });
    if (activeSection === `custom-${deleteTarget.id}`) {
      setActiveSection('personal');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="space-y-0.5 px-1">
        {sectionConfig.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-100 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />
              <span className="flex-1 text-left text-xs">{section.label}</span>
              {isActive && <ChevronRight size={12} className="text-amber-500/50" />}
            </button>
          );
        })}

        {/* Custom blocks */}
        {customBlocks.map((block) => {
          const Icon = CUSTOM_ICON_MAP[block.type] || AlignLeft;
          const isActive = activeSection === `custom-${block.id}`;
          return (
            <div key={block.id} className="relative group">
              <button
                onClick={() => setActiveSection(`custom-${block.id}` as typeof activeSection)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-100 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />
                <span className="flex-1 text-left text-xs truncate">{block.title}</span>
                {isActive && <ChevronRight size={12} className="text-amber-500/50" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteCustomBlock(block); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove block"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-800 pt-3 px-1">
        <button
          onClick={generateFromBlocks}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Apply to LaTeX
        </button>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <h3 className="text-sm font-semibold text-zinc-100">Remove Block</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              Remove <strong className="text-zinc-200">{deleteTarget.title}</strong> from your CV?
            </p>
            <p className="text-xs text-zinc-500 mb-5">
              You can add it again from the Block Store.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCustomBlock}
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}