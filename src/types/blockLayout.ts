export type BlockType =
  | 'header'
  | 'summary'
  | 'education'
  | 'skills'
  | 'projects'
  | 'focusAreas'
  | 'certifications'
  | 'customText'
  | 'languages'
  | 'awards'
  | 'links'
  | 'experience'
  | 'publications';

export type HeaderAlignment = 'left' | 'center' | 'right';
export type NameSize = 'compact' | 'normal' | 'large';
export type ProjectColumns = 1 | 2 | 3;
export type CardSize = 'compact' | 'normal' | 'large';
export type ProjectSpacing = 'compact' | 'normal' | 'relaxed';
export type EducationColumns = 1 | 2;
export type EducationSpacing = 'compact' | 'normal' | 'relaxed';
export type SkillsStyle = 'grouped-lines' | 'chips' | 'compact';
export type SkillsColumns = 1 | 2;
export type SkillsSpacing = 'compact' | 'normal' | 'relaxed';
export type CertificationColumns = 1 | 2 | 3;
export type CertificationSpacing = 'compact' | 'normal' | 'relaxed';
export type SummaryAlignment = 'left' | 'justified';
export type SummarySpacing = 'compact' | 'normal' | 'relaxed';
export type CustomBlockType = 'customText' | 'languages' | 'awards' | 'links' | 'experience' | 'publications';

export interface BlockConfig {
  id: string;
  type: BlockType;
  active: boolean;
  locked: boolean;
  order: number;
  settings: Record<string, unknown>;
}

export interface ResumeLayout {
  version: number;
  blocks: BlockConfig[];
  customBlocksOrder: string[]; // IDs of custom blocks in render order
}

export interface HeaderSettings {
  alignment: HeaderAlignment;
  showPhone: boolean;
  showEmail: boolean;
  showGithub: boolean;
  showLinkedin: boolean;
  showWebsite: boolean;
  showLocation: boolean;
  contactLayout: 'inline' | 'stacked';
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

export const BLOCK_DEFINITIONS: Record<
  BlockType,
  {
    label: string;
    description: string;
    icon: string;
    removable: boolean;
    defaultActive: boolean;
    defaultLocked: boolean;
    supported: boolean;
    unique: boolean;
  }
> = {
  header: { label: 'Header', description: 'Your name, role, and contact info', icon: 'user', removable: false, defaultActive: true, defaultLocked: true, supported: true, unique: true },
  summary: { label: 'Professional Summary', description: 'A brief overview of your experience', icon: 'file-text', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  education: { label: 'Education', description: 'Degrees, institutions, and achievements', icon: 'graduation-cap', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  skills: { label: 'Technical Skills', description: 'Organized skill groups by category', icon: 'wrench', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  projects: { label: 'Selected Projects', description: 'Highlight your best work with cards', icon: 'folder-git2', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  focusAreas: { label: 'Focus Areas', description: 'Areas of expertise or interest', icon: 'target', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  certifications: { label: 'Certifications', description: 'Professional certifications and badges', icon: 'award', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  customText: { label: 'Custom Text Block', description: 'Add a free-form text section', icon: 'align-left', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: false },
  languages: { label: 'Languages', description: 'Spoken languages with proficiency', icon: 'globe', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  awards: { label: 'Awards', description: 'Honors, awards, and recognitions', icon: 'trophy', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  links: { label: 'Links', description: 'Important URLs and online profiles', icon: 'link', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  experience: { label: 'Experience', description: 'Work history placeholder', icon: 'briefcase', removable: true, defaultActive: true, defaultLocked: false, supported: false, unique: false },
  publications: { label: 'Publications', description: 'Papers, articles, and research', icon: 'book-open', removable: true, defaultActive: true, defaultLocked: false, supported: false, unique: false },
};

export type BlockDirection = 'up' | 'down';