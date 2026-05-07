'use client';

import { useState } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { ResumeBlockSidebar } from './ResumeBlockSidebar';
import { BlockManager } from './BlockManager';
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
import { CustomTextBlockEditor } from './editors/CustomTextBlockEditor';
import { LanguagesBlockEditor } from './editors/LanguagesBlockEditor';
import { AwardsBlockEditor } from './editors/AwardsBlockEditor';
import { LinksBlockEditor } from './editors/LinksBlockEditor';

type SidebarTab = 'navigate' | 'layout';

function CustomBlockRouter() {
  const { activeSection, resumeData } = useEditorStore();
  if (!activeSection.startsWith('custom-')) return null;
  const blockId = activeSection.replace('custom-', '');
  const block = resumeData.customBlocks?.find((b) => b.id === blockId);
  if (!block) return null;
  switch (block.type) {
    case 'customText': return <CustomTextBlockEditor blockId={blockId} />;
    case 'languages': return <LanguagesBlockEditor blockId={blockId} />;
    case 'awards': return <AwardsBlockEditor blockId={blockId} />;
    case 'links': return <LinksBlockEditor blockId={blockId} />;
    default: return <p className="text-xs text-zinc-500 p-3">This block type is not yet editable.</p>;
  }
}

export function BlockEditorRouter() {
  const { activeSection, toggleAiDrawer } = useEditorStore();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('navigate');

  return (
    <div className="flex flex-col h-full">
      {/* Navigation sidebar */}
      <div className="w-full border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarTab('navigate')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                sidebarTab === 'navigate'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Navigate
            </button>
            <button
              onClick={() => setSidebarTab('layout')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                sidebarTab === 'layout'
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Layout
            </button>
          </div>
          <button
            onClick={toggleAiDrawer}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors"
            title="AI Assistant"
          >
            <Sparkles size={14} />
          </button>
        </div>
        {sidebarTab === 'navigate' ? <ResumeBlockSidebar /> : <BlockManager />}
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
        {activeSection.startsWith('custom-') && <CustomBlockRouter />}
      </div>
    </div>
  );
}