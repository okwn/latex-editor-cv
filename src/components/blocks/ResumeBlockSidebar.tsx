'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
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
} from 'lucide-react';

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

export function ResumeBlockSidebar() {
  const { activeSection, setActiveSection, generateFromBlocks } = useEditorStore();

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
    </div>
  );
}