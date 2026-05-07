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
  | 'publications'
  | 'tools'
  | 'softSkills'
  | 'courses'
  | 'openSource'
  | 'interests'
  | 'volunteer'
  | 'patents'
  | 'talks'
  | 'caseStudies'
  | 'references';

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
export type CustomBlockType = 'customText' | 'languages' | 'awards' | 'links' | 'experience' | 'publications' | 'tools' | 'softSkills' | 'courses' | 'openSource' | 'interests' | 'volunteer' | 'patents' | 'talks' | 'caseStudies' | 'references';

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
    category: 'core' | 'career' | 'skills' | 'portfolio' | 'credentials' | 'extra';
    removable: boolean;
    defaultActive: boolean;
    defaultLocked: boolean;
    supported: boolean;
    unique: boolean;
  }
> = {
  // Core
  header: { label: 'Header', description: 'Your name, role, and contact info', icon: 'user', category: 'core', removable: false, defaultActive: true, defaultLocked: true, supported: true, unique: true },
  summary: { label: 'Professional Summary', description: 'A brief overview of your experience and goals', icon: 'file-text', category: 'core', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  education: { label: 'Education', description: 'Degrees, institutions, and achievements', icon: 'graduation-cap', category: 'core', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  skills: { label: 'Technical Skills', description: 'Organized skill groups by category', icon: 'wrench', category: 'core', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  projects: { label: 'Selected Projects', description: 'Highlight your best work with cards', icon: 'folder-git2', category: 'core', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  focusAreas: { label: 'Focus Areas', description: 'Areas of expertise or interest', icon: 'target', category: 'core', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  certifications: { label: 'Certifications', description: 'Professional certifications and badges', icon: 'award', category: 'credentials', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },

  // Career
  experience: { label: 'Work Experience', description: 'Full-time roles, positions, and responsibilities', icon: 'briefcase', category: 'career', removable: true, defaultActive: true, defaultLocked: false, supported: false, unique: false },
  volunteer: { label: 'Volunteer Experience', description: 'Community service and volunteering', icon: 'heart', category: 'career', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: false },

  // Skills
  languages: { label: 'Languages', description: 'Spoken languages with proficiency levels', icon: 'globe', category: 'skills', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  tools: { label: 'Tools', description: 'Software, platforms, and tooling you use', icon: 'tool', category: 'skills', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: true },
  softSkills: { label: 'Soft Skills', description: 'Interpersonal and communication skills', icon: 'users', category: 'skills', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: true },

  // Portfolio
  links: { label: 'Links', description: 'Important URLs and online profiles', icon: 'link', category: 'portfolio', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  publications: { label: 'Publications', description: 'Papers, articles, and research', icon: 'book-open', category: 'portfolio', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: false },
  talks: { label: 'Talks', description: 'Conference talks, presentations, and webinars', icon: 'mic', category: 'portfolio', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: false },
  openSource: { label: 'Open Source', description: 'Your open source contributions', icon: 'code', category: 'portfolio', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: true },
  caseStudies: { label: 'Case Studies', description: 'Detailed project analyses and outcomes', icon: 'bar-chart', category: 'portfolio', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: false },

  // Credentials/Extra
  awards: { label: 'Awards', description: 'Honors, awards, and recognitions', icon: 'trophy', category: 'credentials', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: true },
  courses: { label: 'Courses', description: 'Completed courses and training programs', icon: 'book', category: 'credentials', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: true },
  patents: { label: 'Patents', description: 'Patents filed or granted', icon: 'file-sign', category: 'credentials', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: false },
  references: { label: 'References', description: 'Professional references and testimonials', icon: 'quote', category: 'credentials', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: true },
  interests: { label: 'Interests', description: 'Hobbies, causes, and personal interests', icon: 'star', category: 'extra', removable: true, defaultActive: false, defaultLocked: false, supported: false, unique: true },
  customText: { label: 'Custom Text', description: 'Add a free-form text section with custom content', icon: 'align-left', category: 'extra', removable: true, defaultActive: true, defaultLocked: false, supported: true, unique: false },
};

export type BlockDirection = 'up' | 'down';