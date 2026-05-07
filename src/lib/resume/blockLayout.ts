import type {
  BlockType,
  HeaderAlignment,
  NameSize,
  ProjectColumns,
  CardSize,
  ProjectSpacing,
  EducationColumns,
  EducationSpacing,
  SkillsStyle,
  SkillsColumns,
  SkillsSpacing,
  CertificationColumns,
  CertificationSpacing,
  SummaryAlignment,
  SummarySpacing,
  BlockConfig,
  BlockDirection,
  ResumeLayout,
  CustomBlockType,
} from '@/types/blockLayout';
import type { Resume, CustomBlock } from '@/types/resume';
import { BLOCK_DEFINITIONS } from '@/types/blockLayout';
import { v4 as uuid } from 'uuid';

export type {
  BlockType,
  HeaderAlignment,
  NameSize,
  ProjectColumns,
  CardSize,
  ProjectSpacing,
  EducationColumns,
  EducationSpacing,
  SkillsStyle,
  SkillsColumns,
  SkillsSpacing,
  CertificationColumns,
  CertificationSpacing,
  SummaryAlignment,
  SummarySpacing,
  BlockConfig,
  BlockDirection,
  ResumeLayout,
  CustomBlockType,
};

export { BLOCK_DEFINITIONS };

export function getDefaultBlockLayout(): ResumeLayout {
  const blockOrder: BlockType[] = [
    'header',
    'summary',
    'education',
    'skills',
    'projects',
    'focusAreas',
    'certifications',
  ];

  return {
    version: 1,
    blocks: blockOrder.map((type, index) => {
      const def = BLOCK_DEFINITIONS[type];
      return {
        id: uuid(),
        type,
        active: def.defaultActive,
        locked: def.defaultLocked,
        order: index,
        settings: getDefaultBlockSettings(type),
      };
    }),
    customBlocksOrder: [],
  };
}

export function getDefaultBlockSettings(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'header':
      return {
        alignment: 'center',
        showPhone: true,
        showEmail: true,
        showGithub: true,
        showLinkedin: true,
        showWebsite: true,
        nameSize: 'normal',
      } satisfies HeaderSettings;
    case 'summary':
      return {
        alignment: 'left',
        spacing: 'normal',
      } satisfies SummarySettings;
    case 'education':
      return {
        columns: 2,
        spacing: 'normal',
      } satisfies EducationSettings;
    case 'skills':
      return {
        style: 'grouped-lines',
        columns: 2,
        spacing: 'normal',
      } satisfies SkillsSettings;
    case 'projects':
      return {
        columns: 2,
        cardSize: 'normal',
        showLinks: true,
        showTags: true,
        maxProjects: undefined,
        spacing: 'normal',
      } satisfies ProjectSettings;
    case 'focusAreas':
      return {
        columns: 3,
        spacing: 'normal',
      };
    case 'certifications':
      return {
        columns: 3,
        spacing: 'normal',
      } satisfies CertificationSettings;
    default:
      return {};
  }
}

export interface HeaderSettings {
  alignment: HeaderAlignment;
  showPhone: boolean;
  showEmail: boolean;
  showGithub: boolean;
  showLinkedin: boolean;
  showWebsite: boolean;
  nameSize: NameSize;
}

export interface SummarySettings {
  alignment: SummaryAlignment;
  spacing: SummarySpacing;
}

export interface EducationSettings {
  columns: EducationColumns;
  spacing: EducationSpacing;
}

export interface SkillsSettings {
  style: SkillsStyle;
  columns: SkillsColumns;
  spacing: SkillsSpacing;
}

export interface ProjectSettings {
  columns: ProjectColumns;
  cardSize: CardSize;
  showLinks: boolean;
  showTags: boolean;
  maxProjects: number | undefined;
  spacing: ProjectSpacing;
}

export interface CertificationSettings {
  columns: CertificationColumns;
  spacing: CertificationSpacing;
}

// Normalize a resume's layout, ensuring all blocks have typed settings
export function normalizeBlockLayout(resume: Resume): Resume {
  let layout: ResumeLayout;

  if (resume.resumeLayout) {
    layout = {
      ...resume.resumeLayout,
      version: resume.resumeLayout.version ?? 1,
    };
  } else {
    layout = getDefaultBlockLayout();
  }

  // Migrate: add customBlocksOrder if missing
  if (!('customBlocksOrder' in layout)) {
    const existing = layout as ResumeLayout & { customBlocksOrder?: string[] };
    existing.customBlocksOrder = [];
    layout = existing as ResumeLayout;
  }

  // Ensure typed settings on all blocks
  layout = {
    ...layout,
    blocks: layout.blocks.map((block: BlockConfig) => {
      if (!block.settings || Object.keys(block.settings).length === 0) {
        return { ...block, settings: getDefaultBlockSettings(block.type) };
      }
      return block;
    }),
  };

  // Ensure ALL default block types are present (migration for old saved layouts)
  const defaultLayout = getDefaultBlockLayout();
  const existingTypes = new Set(layout.blocks.map((b) => b.type));
  for (const defBlock of defaultLayout.blocks) {
    if (!existingTypes.has(defBlock.type)) {
      layout.blocks.push({
        id: defBlock.id,
        type: defBlock.type,
        active: defBlock.active,
        locked: defBlock.locked,
        order: layout.blocks.length,
        settings: getDefaultBlockSettings(defBlock.type),
      });
    }
  }

  // Re-normalize order to be contiguous
  layout.blocks = layout.blocks
    .map((b, i) => ({ ...b, order: i }))
    .sort((a, b) => a.order - b.order);

  // Ensure customBlocks exists
  if (!resume.customBlocks) {
    return { ...resume, resumeLayout: layout, customBlocks: [] };
  }

  // Deduplicate layout blocks and custom blocks
  let result = deduplicateAllBlocks({ ...resume, resumeLayout: layout });

  return { ...result, resumeLayout: result.resumeLayout || layout };
}

export function getActiveBlocksInOrder(layout: ResumeLayout): BlockConfig[] {
  return [...layout.blocks].sort((a, b) => a.order - b.order).filter((b) => b.active);
}

export function getBlockById(layout: ResumeLayout, blockId: string): BlockConfig | undefined {
  return layout.blocks.find((b) => b.id === blockId);
}

export function moveBlock(layout: ResumeLayout, blockId: string, direction: BlockDirection): ResumeLayout {
  const sorted = [...layout.blocks].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((b) => b.id === blockId);
  if (idx === -1) return layout;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= sorted.length) return layout;
  const updated = [...sorted];
  const [moved] = updated.splice(idx, 1);
  updated.splice(newIdx, 0, moved);
  return { ...layout, blocks: updated.map((b, i) => ({ ...b, order: i })) };
}

export function toggleBlockActive(layout: ResumeLayout, blockId: string): ResumeLayout {
  const block = getBlockById(layout, blockId);
  if (!block || block.locked) return layout;
  return {
    ...layout,
    blocks: layout.blocks.map((b) => (b.id === blockId ? { ...b, active: !b.active } : b)),
  };
}

export function removeBlock(layout: ResumeLayout, blockId: string): ResumeLayout {
  const block = getBlockById(layout, blockId);
  if (!block || block.locked || !BLOCK_DEFINITIONS[block.type].removable) return layout;
  const filtered = layout.blocks.filter((b) => b.id !== blockId);
  return { ...layout, blocks: filtered.map((b, i) => ({ ...b, order: i })) };
}

// Check if a block type is already present (for unique blocks)
export function hasBlockOfType(layout: ResumeLayout, type: BlockType): boolean {
  return layout.blocks.some((b) => b.type === type);
}

export function addBlock(layout: ResumeLayout, type: BlockType): ResumeLayout {
  const def = BLOCK_DEFINITIONS[type];
  if (!def.removable && !def.supported) return layout;

  // For unique blocks, don't add if already present
  if (def.unique && hasBlockOfType(layout, type)) return layout;

  const newBlock: BlockConfig = {
    id: uuid(),
    type,
    active: true,
    locked: false,
    order: layout.blocks.length,
    settings: getDefaultBlockSettings(type),
  };

  return { ...layout, blocks: [...layout.blocks, newBlock] };
}

export function isBlockActive(layout: ResumeLayout, type: BlockType): boolean {
  const block = layout.blocks.find((b) => b.type === type);
  return block ? block.active : BLOCK_DEFINITIONS[type].defaultActive;
}

export function updateBlockSettings(
  layout: ResumeLayout,
  blockId: string,
  settings: Record<string, unknown>
): ResumeLayout {
  return {
    ...layout,
    blocks: layout.blocks.map((b) => (b.id === blockId ? { ...b, settings: { ...b.settings, ...settings } } : b)),
  };
}

export function getBlockSettings<T extends Record<string, unknown>>(layout: ResumeLayout, blockId: string): T | undefined {
  const block = getBlockById(layout, blockId);
  return block?.settings as T | undefined;
}

export function getBlockSettingsByType<T extends Record<string, unknown>>(layout: ResumeLayout, type: BlockType): T | undefined {
  const block = layout.blocks.find((b) => b.type === type);
  return block?.settings as T | undefined;
}

// Custom blocks order management
export function moveCustomBlock(resume: Resume, customBlockId: string, direction: 'up' | 'down'): Resume {
  if (!resume.resumeLayout) return resume;
  const order = [...(resume.resumeLayout.customBlocksOrder || [])];
  const idx = order.indexOf(customBlockId);
  if (idx === -1) return resume;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= order.length) return resume;
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  return {
    ...resume,
    resumeLayout: { ...resume.resumeLayout, customBlocksOrder: order },
  };
}

export function removeCustomBlock(resume: Resume, customBlockId: string): Resume {
  if (!resume.customBlocks) return resume;
  return {
    ...resume,
    customBlocks: resume.customBlocks.filter((b) => b.id !== customBlockId),
    resumeLayout: resume.resumeLayout
      ? { ...resume.resumeLayout, customBlocksOrder: resume.resumeLayout.customBlocksOrder.filter((id) => id !== customBlockId) }
      : undefined,
  };
}

export function addCustomBlock(resume: Resume, type: CustomBlockType, title?: string): Resume {
  const id = uuid();
  let newBlock: CustomBlock;

  switch (type) {
    case 'customText':
      newBlock = { id, type: 'customText', title: title || 'Custom Section', paragraphs: [''] };
      break;
    case 'languages':
      newBlock = { id, type: 'languages', title: title || 'Languages', items: [{ language: '', proficiency: '' }] };
      break;
    case 'awards':
      newBlock = { id, type: 'awards', title: title || 'Awards', items: [{ title: '', issuer: '', year: '' }] };
      break;
    case 'links':
      newBlock = { id, type: 'links', title: title || 'Links', items: [{ label: '', url: '' }] };
      break;
    case 'experience':
      newBlock = { id, type: 'experience', title: title || 'Experience', items: [{ role: '', company: '', period: '', description: '' }] };
      break;
    case 'publications':
      newBlock = { id, type: 'publications', title: title || 'Publications', items: [{ title: '', venue: '', year: '' }] };
      break;
  }

  return {
    ...resume,
    customBlocks: [...(resume.customBlocks || []), newBlock],
    resumeLayout: resume.resumeLayout
      ? { ...resume.resumeLayout, customBlocksOrder: [...(resume.resumeLayout.customBlocksOrder || []), id] }
      : undefined,
  };
}

export function updateCustomBlock(resume: Resume, blockId: string, updates: Partial<CustomBlock>): Resume {
  if (!resume.customBlocks) return resume;
  return {
    ...resume,
    customBlocks: resume.customBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } as CustomBlock : b)),
  };
}

export function getCustomBlock(resume: Resume, blockId: string): CustomBlock | undefined {
  return resume.customBlocks?.find((b) => b.id === blockId);
}

export function getCustomBlocksInOrder(resume: Resume): CustomBlock[] {
  if (!resume.resumeLayout?.customBlocksOrder || !resume.customBlocks) return resume.customBlocks || [];
  const byId = new Map(resume.customBlocks.map((b) => [b.id, b]));
  return resume.resumeLayout.customBlocksOrder.map((id) => byId.get(id)).filter(Boolean) as CustomBlock[];
}

// Deduplicate layout blocks — keep only first entry per unique block type
function dedupeLayoutBlocks(resume: Resume): Resume {
  if (!resume.resumeLayout?.blocks?.length) return resume;

  const seen = new Map<BlockType, string>();
  const keep: BlockConfig[] = [];

  for (const block of resume.resumeLayout.blocks) {
    const def = BLOCK_DEFINITIONS[block.type];
    if (!def.unique) {
      keep.push(block);
      continue;
    }
    if (seen.has(block.type)) {
      continue;
    }
    seen.set(block.type, block.id);
    keep.push(block);
  }

  if (keep.length === resume.resumeLayout.blocks.length) return resume;

  const deduped = {
    ...resume.resumeLayout,
    blocks: keep.map((b, i) => ({ ...b, order: i })),
  };

  return { ...resume, resumeLayout: deduped };
}

// Deduplicate custom blocks — keep only first entry per unique custom block type
function dedupeCustomBlocks(resume: Resume): Resume {
  if (!resume.customBlocks?.length) return resume;

  const seen = new Map<CustomBlockType, string>();
  const keep: CustomBlock[] = [];

  for (const block of resume.customBlocks) {
    const def = BLOCK_DEFINITIONS[block.type as CustomBlockType];
    if (!def.unique) {
      keep.push(block);
      continue;
    }
    if (seen.has(block.type as CustomBlockType)) {
      continue;
    }
    seen.set(block.type as CustomBlockType, block.id);
    keep.push(block);
  }

  if (keep.length === resume.customBlocks.length) return resume;

  const removeIds = resume.customBlocks
    .map((b) => b.id)
    .filter((id) => !keep.some((k) => k.id === id));

  const order = (resume.resumeLayout?.customBlocksOrder || []).filter((id) => !removeIds.includes(id));

  return {
    ...resume,
    customBlocks: keep,
    resumeLayout: resume.resumeLayout
      ? { ...resume.resumeLayout, customBlocksOrder: order }
      : undefined,
  };
}

// Combined deduplication: layout blocks + custom blocks
export function deduplicateAllBlocks(resume: Resume): Resume {
  let result = dedupeLayoutBlocks(resume);
  result = dedupeCustomBlocks(result);
  return result;
}

// Returns 'add' | 'added' | 'activate' | 'coming-soon' for a given block type
export function getBlockStoreStatus(resume: Resume, type: BlockType): 'add' | 'added' | 'activate' | 'coming-soon' {
  const def = BLOCK_DEFINITIONS[type];
  if (!def.supported) return 'coming-soon';

  const layout = resume.resumeLayout;
  if (layout?.blocks) {
    const block = layout.blocks.find((b) => b.type === type);
    if (block) {
      return block.active ? 'added' : 'activate';
    }
  }

  const isCustomType = ['customText', 'languages', 'awards', 'links', 'experience', 'publications'].includes(type);
  if (isCustomType) {
    const exists = (resume.customBlocks || []).some((b) => b.type === type);
    if (exists) {
      return def.unique ? 'added' : 'add';
    }
  }

  return 'add';
}