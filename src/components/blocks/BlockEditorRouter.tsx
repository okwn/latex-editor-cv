'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import { ResumeBlockSidebar } from './ResumeBlockSidebar';
import { HeaderBlockEditor } from './HeaderBlockEditor';
import { SummaryBlockEditor } from './SummaryBlockEditor';
import { EducationBlockEditor } from './EducationBlockEditor';
import { SkillsBlockEditor } from './SkillsBlockEditor';
import { ProjectsBlockEditor } from './ProjectsBlockEditor';
import { FocusAreasBlockEditor } from './FocusAreasBlockEditor';
import { CertificationsBlockEditor } from './CertificationsBlockEditor';
import { TemplateSelector } from '../editor/TemplateSelector';
import { SnapshotManager } from '../editor/SnapshotManager';
import { ExportPanel } from '../editor/ExportPanel';
import { Sparkles } from 'lucide-react';

export function BlockEditorRouter() {
  const { activeSection, toggleAiDrawer } = useEditorStore();

  return (
    <div className="flex flex-col h-full">
      {/* Navigation sidebar */}
      <div className="w-full border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Blocks</span>
          <button
            onClick={toggleAiDrawer}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors"
            title="AI Assistant"
          >
            <Sparkles size={14} />
          </button>
        </div>
        <ResumeBlockSidebar />
      </div>

      {/* Active editor */}
      <div className="flex-1 overflow-auto">
        {activeSection === 'personal' && <HeaderBlockEditor />}
        {activeSection === 'summary' && <SummaryBlockEditor />}
        {activeSection === 'education' && <EducationBlockEditor />}
        {activeSection === 'skills' && <SkillsBlockEditor />}
        {activeSection === 'projects' && <ProjectsBlockEditor />}
        {activeSection === 'focusAreas' && <FocusAreasBlockEditor />}
        {activeSection === 'certifications' && <CertificationsBlockEditor />}
        {activeSection === 'template' && <TemplateSelector />}
        {activeSection === 'snapshots' && <SnapshotManager />}
        {activeSection === 'export' && <ExportPanel />}
      </div>
    </div>
  );
}