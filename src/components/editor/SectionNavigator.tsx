'use client';

import { useEditorStore, ActiveSection } from '@/lib/resume/editorStore';
import {
  User,
  GraduationCap,
  Wrench,
  FolderGit2,
  FileText,
  Award,
  LayoutTemplate,
  ChevronRight,
} from 'lucide-react';

const sections: { id: ActiveSection; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'focusAreas', label: 'Focus Areas', icon: FileText },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'template', label: 'Template', icon: LayoutTemplate },
];

export function SectionNavigator() {
  const { activeSection, setActiveSection } = useEditorStore();

  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
              isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-amber-400' : ''} />
            <span className="flex-1 text-left">{section.label}</span>
            {isActive && <ChevronRight size={14} className="text-amber-500/50" />}
          </button>
        );
      })}
    </nav>
  );
}