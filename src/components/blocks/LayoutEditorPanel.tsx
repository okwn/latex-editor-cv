'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
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
import { CustomTextBlockEditor } from './editors/CustomTextBlockEditor';
import { LanguagesBlockEditor } from './editors/LanguagesBlockEditor';
import { AwardsBlockEditor } from './editors/AwardsBlockEditor';
import { LinksBlockEditor } from './editors/LinksBlockEditor';
import { ToolsBlockEditor } from './editors/ToolsBlockEditor';
import { SoftSkillsBlockEditor } from './editors/SoftSkillsBlockEditor';
import { CoursesBlockEditor } from './editors/CoursesBlockEditor';
import { OpenSourceBlockEditor } from './editors/OpenSourceBlockEditor';
import { InterestsBlockEditor } from './editors/InterestsBlockEditor';
import { ExperienceBlockEditor } from './editors/ExperienceBlockEditor';
import type { BlockType } from '@/types/blockLayout';
import { getBlockById } from '@/lib/resume/blockLayout';

/**
 * Maps a block type to its editor component.
 */
function getEditorForType(type: BlockType): React.ReactNode {
  switch (type) {
    case 'header': return <HeaderBlockEditor />;
    case 'summary': return <SummaryBlockEditor />;
    case 'education': return <EducationBlockEditor />;
    case 'skills': return <SkillsBlockEditor />;
    case 'projects': return <ProjectsBlockEditor />;
    case 'focusAreas': return <FocusAreasBlockEditor />;
    case 'certifications': return <CertificationsBlockEditor />;
    default: return <MissingEditorHint type={type} />;
  }
}

function MissingEditorHint({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <p className="text-sm text-zinc-400 mb-1">No editor for block type</p>
      <p className="text-xs text-zinc-600 font-mono bg-zinc-800 px-2 py-1 rounded">{type}</p>
      <p className="text-xs text-zinc-600 mt-3">This block type does not yet have an editor form.</p>
    </div>
  );
}

/**
 * LayoutEditorPanel
 *
 * Renders the block editor for whatever is selected in activeSection.
 *
 * Routing logic:
 * - Static strings ('personal', 'summary', ...) → direct editor
 * - 'block-${id}' → look up block from resumeLayout.blocks by ID, route by block.type
 * - 'custom-${id}' → look up from resumeData.customBlocks, route by block.type
 * - Unknown/missing → helpful placeholder
 */
export function LayoutEditorPanel() {
  const { activeSection, resumeData } = useEditorStore();
  const layout = resumeData.resumeLayout;

  // Handle 'block-${id}' — core blocks selected from Navigate/PDF
  if ((activeSection as string).startsWith('block-')) {
    const blockId = (activeSection as string).replace('block-', '');
    if (!layout) return <NoLayoutPlaceholder />;
    const block = getBlockById(layout, blockId);
    if (!block) return <BlockNotFoundPlaceholder blockId={blockId} />;
    return getEditorForType(block.type);
  }

  // Handle 'custom-${id}' — custom blocks
  if ((activeSection as string).startsWith('custom-')) {
    return <CustomBlockEditorFromRoute />;
  }

  // Static section routes
  if (activeSection === 'personal') return <HeaderBlockEditor />;
  if (activeSection === 'summary') return <SummaryBlockEditor />;
  if (activeSection === 'education') return <EducationBlockEditor />;
  if (activeSection === 'skills') return <SkillsBlockEditor />;
  if (activeSection === 'projects') return <ProjectsBlockEditor />;
  if (activeSection === 'focusAreas') return <FocusAreasBlockEditor />;
  if (activeSection === 'certifications') return <CertificationsBlockEditor />;
  if (activeSection === 'template') return <TemplateSelector />;
  if (activeSection === 'snapshots') return <SnapshotManager />;
  if (activeSection === 'export') return <ExportPanel />;

  return <NoBlockSelectedPlaceholder />;
}

function NoLayoutPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <p className="text-xs text-zinc-500">No layout found. Add blocks from the Block Store.</p>
    </div>
  );
}

function BlockNotFoundPlaceholder({ blockId }: { blockId: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <p className="text-xs text-zinc-500">Block not found.</p>
      <p className="text-xs text-zinc-600 font-mono bg-zinc-800 px-2 py-1 rounded mt-1">{blockId.slice(0, 8)}</p>
    </div>
  );
}

function NoBlockSelectedPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
          <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      </div>
      <p className="text-sm text-zinc-500 mb-1">No block selected</p>
      <p className="text-xs text-zinc-600">
        Click a block in Navigate or the PDF preview to start editing.
      </p>
    </div>
  );
}

function CustomBlockEditorFromRoute() {
  const { activeSection, resumeData } = useEditorStore();
  if (!(activeSection as string).startsWith('custom-')) return null;
  const blockId = (activeSection as string).replace('custom-', '');
  const block = resumeData.customBlocks?.find((b) => b.id === blockId);
  if (!block) {
    return (
      <div className="flex items-center justify-center h-full text-center px-8">
        <p className="text-xs text-zinc-500">Block not found.</p>
      </div>
    );
  }
  switch (block.type) {
    case 'customText': return <CustomTextBlockEditor blockId={blockId} />;
    case 'languages': return <LanguagesBlockEditor blockId={blockId} />;
    case 'awards': return <AwardsBlockEditor blockId={blockId} />;
    case 'links': return <LinksBlockEditor blockId={blockId} />;
    case 'tools': return <ToolsBlockEditor blockId={blockId} />;
    case 'softSkills': return <SoftSkillsBlockEditor blockId={blockId} />;
    case 'courses': return <CoursesBlockEditor blockId={blockId} />;
    case 'openSource': return <OpenSourceBlockEditor blockId={blockId} />;
    case 'interests': return <InterestsBlockEditor blockId={blockId} />;
    case 'experience': return <ExperienceBlockEditor blockId={blockId} />;
    default: return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p className="text-sm text-zinc-400 mb-1">No editor for block type</p>
        <p className="text-xs text-zinc-600 font-mono bg-zinc-800 px-2 py-1 rounded">{block.type}</p>
        <p className="text-xs text-zinc-600 mt-3">This block type does not yet have an editor form.</p>
      </div>
    );
  }
}