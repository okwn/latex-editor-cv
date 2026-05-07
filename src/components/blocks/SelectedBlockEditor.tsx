'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import {
  BLOCK_DEFINITIONS,
  getBlockById,
  getCustomBlock,
  moveBlock,
  toggleBlockActive,
  removeBlock,
  removeCustomBlock,
  type BlockType,
  type BlockDirection,
} from '@/lib/resume/blockLayout';
import type { CustomBlock } from '@/types/resume';
import type { Resume } from '@/types/resume';
import { useToast } from '@/components/ui/Toast';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  X,
  Plus,
} from 'lucide-react';
import { useState } from 'react';

// Block-specific editors
import { HeaderBlockEditor } from './HeaderBlockEditor';
import { SummaryBlockEditor } from './SummaryBlockEditor';
import { EducationBlockEditor } from './EducationBlockEditor';
import { SkillsBlockEditor } from './SkillsBlockEditor';
import { ProjectsBlockEditor } from './ProjectsBlockEditor';
import { FocusAreasBlockEditor } from './FocusAreasBlockEditor';
import { CertificationsBlockEditor } from './CertificationsBlockEditor';
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

interface SelectedBlockEditorProps {
  compact?: boolean;
}

export function SelectedBlockEditor({ compact = false }: SelectedBlockEditorProps) {
  const toast = useToast();
  const {
    selectedBlockId,
    setSelectedBlockId,
    setActiveLeftTab,
    resumeData,
    updateResumeData,
    activeSection,
    setActiveSection,
  } = useEditorStore();

  const layout = resumeData.resumeLayout;
  const [showSettings, setShowSettings] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'core' | 'custom'; id: string; label: string } | null>(null);

  // Determine what kind of block is selected
  const isCoreBlock = (activeSection as string).startsWith('block-');
  const isCustomBlock = (activeSection as string).startsWith('custom-');

  // Get block info for header
  let blockLabel = 'Unknown';
  let blockType: BlockType | CustomBlock['type'] | null = null;
  let isActive = true;
  let isLocked = false;

  if (isCoreBlock && layout) {
    const blockId = (activeSection as string).replace('block-', '');
    const block = getBlockById(layout, blockId);
    if (block) {
      const def = BLOCK_DEFINITIONS[block.type];
      blockLabel = def?.label ?? block.type;
      blockType = block.type;
      isActive = block.active;
      isLocked = block.locked;
    }
  } else if (isCustomBlock) {
    const blockId = (activeSection as string).replace('custom-', '');
    const block = getCustomBlock(resumeData, blockId);
    if (block) {
      blockLabel = block.title;
      blockType = block.type;
    }
  } else if (activeSection && !isCoreBlock && !isCustomBlock) {
    // Static section like 'personal', 'certifications', etc.
    const staticLabels: Record<string, string> = {
      personal: 'Personal Info',
      summary: 'Professional Summary',
      education: 'Education',
      skills: 'Technical Skills',
      projects: 'Selected Projects',
      focusAreas: 'Focus Areas',
      certifications: 'Certifications',
    };
    blockLabel = staticLabels[activeSection as string] ?? activeSection;
  }

  const handleClose = () => {
    setSelectedBlockId(null);
    setActiveSection('personal');
  };

  const handleMove = (direction: BlockDirection) => {
    if (!layout || !isCoreBlock) return;
    const blockId = (activeSection as string).replace('block-', '');
    const newLayout = moveBlock(layout, blockId, direction);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
  };

  const handleToggleActive = () => {
    if (!layout || !isCoreBlock || isLocked) return;
    const blockId = (activeSection as string).replace('block-', '');
    const newLayout = toggleBlockActive(layout, blockId);
    updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
  };

  const handleDelete = () => {
    if (isCoreBlock && layout) {
      const blockId = (activeSection as string).replace('block-', '');
      const block = getBlockById(layout, blockId);
      if (block) {
        const def = BLOCK_DEFINITIONS[block.type];
        setDeleteTarget({ type: 'core', id: blockId, label: def?.label ?? block.type });
      }
    } else if (isCustomBlock) {
      const blockId = (activeSection as string).replace('custom-', '');
      const block = getCustomBlock(resumeData, blockId);
      if (block) {
        setDeleteTarget({ type: 'custom', id: blockId, label: block.title });
      }
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'core' && layout) {
      const newLayout = removeBlock(layout, deleteTarget.id);
      updateResumeData((prev) => ({ ...prev, resumeLayout: newLayout }));
      toast({ message: `${deleteTarget.label} removed`, type: 'success' });
    } else if (deleteTarget.type === 'custom') {
      const newResume = removeCustomBlock(resumeData, deleteTarget.id);
      updateResumeData(() => newResume);
      toast({ message: `${deleteTarget.label} removed`, type: 'success' });
    }
    setDeleteTarget(null);
    setActiveSection('personal');
  };

  // No block selected
  if (!activeSection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <p className="text-sm text-zinc-500 mb-1">No block selected</p>
        <p className="text-xs text-zinc-600">Click a block in Navigate or the PDF preview to start editing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header toolbar */}
      {!compact && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-zinc-200 truncate">{blockLabel}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Active toggle */}
            {isCoreBlock && !isLocked && (
              <button
                onClick={handleToggleActive}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                title={isActive ? 'Deactivate' : 'Activate'}
              >
                {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
            )}

            {/* Move up/down */}
            {isCoreBlock && (
              <>
                <button
                  onClick={() => handleMove('up')}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="Move up"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  onClick={() => handleMove('down')}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="Move down"
                >
                  <ChevronDown size={13} />
                </button>
              </>
            )}

            {/* Settings (future) */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1 rounded transition-colors ${showSettings ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              title="Block settings"
            >
              <Settings size={13} />
            </button>

            {/* Delete */}
            {(isCoreBlock || isCustomBlock) && (
              <button
                onClick={handleDelete}
                className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                title="Remove block"
              >
                <Trash2 size={13} />
              </button>
            )}

            {/* Close */}
            <button
              onClick={handleClose}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Close"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Block editor content */}
      <div className="flex-1 overflow-auto">
        <BlockEditor activeSection={activeSection as string} resumeData={resumeData} />
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <Trash2 size={18} className="text-red-400 shrink-0" />
              <h3 className="text-sm font-semibold text-zinc-100">Remove Block</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              Remove <strong className="text-zinc-200">{deleteTarget.label}</strong> from your CV?
            </p>
            <p className="text-xs text-zinc-500 mb-5">You can add it again from the Block Store.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

interface BlockEditorProps {
  activeSection: string;
  resumeData: Resume;
}

function BlockEditor({ activeSection, resumeData }: BlockEditorProps) {
  const layout = resumeData?.resumeLayout;

  // Core block routing via block-${id}
  if (activeSection.startsWith('block-')) {
    const blockId = activeSection.replace('block-', '');
    if (!layout) return <NoLayoutState />;
    const block = getBlockById(layout, blockId);
    if (!block) return <BlockNotFoundState blockId={blockId} />;
    return <CoreBlockEditor type={block.type} blockId={blockId} />;
  }

  // Custom block routing via custom-${id}
  if (activeSection.startsWith('custom-')) {
    const blockId = activeSection.replace('custom-', '');
    const block = getCustomBlock(resumeData as Resume, blockId);
    if (!block) return <BlockNotFoundState blockId={blockId} />;
    return <CustomBlockEditor blockId={blockId} block={block} />;
  }

  // Static section routing
  switch (activeSection) {
    case 'personal': return <HeaderBlockEditor />;
    case 'summary': return <SummaryBlockEditor />;
    case 'education': return <EducationBlockEditor />;
    case 'skills': return <SkillsBlockEditor />;
    case 'projects': return <ProjectsBlockEditor />;
    case 'focusAreas': return <FocusAreasBlockEditor />;
    case 'certifications': return <CertificationsBlockEditor />;
    default: return <UnknownSectionState section={activeSection} />;
  }
}

function CoreBlockEditor({ type, blockId }: { type: BlockType; blockId: string }) {
  // Core block editors
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

function CustomBlockEditor({ blockId, block }: { blockId: string; block: CustomBlock }) {
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
    default: return <MissingEditorHint type={block.type} />;
  }
}

function NoLayoutState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <p className="text-xs text-zinc-500">No layout found. Add blocks from the Block Store.</p>
    </div>
  );
}

function BlockNotFoundState({ blockId }: { blockId: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <p className="text-xs text-zinc-500">Block not found.</p>
      <p className="text-xs text-zinc-600 font-mono bg-zinc-800 px-2 py-1 rounded mt-1">{blockId.slice(0, 8)}</p>
    </div>
  );
}

function UnknownSectionState({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <p className="text-xs text-zinc-500">No editor for section</p>
      <p className="text-xs text-zinc-600 font-mono bg-zinc-800 px-2 py-1 rounded mt-1">{section}</p>
    </div>
  );
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