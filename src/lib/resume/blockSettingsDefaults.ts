import type {
  HeaderSettings,
  SummarySettings,
  EducationSettings,
  SkillsSettings,
  ProjectSettings,
  CertificationSettings,
} from '@/types/blockLayout';

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  alignment: 'center',
  showPhone: true,
  showEmail: true,
  showGithub: true,
  showLinkedin: true,
  showWebsite: true,
  showLocation: false,
  contactLayout: 'inline',
  nameSize: 'normal',
};

export const DEFAULT_SUMMARY_SETTINGS: SummarySettings = {
  alignment: 'left',
  spacing: 'normal',
};

export const DEFAULT_EDUCATION_SETTINGS: EducationSettings = {
  columns: 2,
  spacing: 'normal',
};

export const DEFAULT_SKILLS_SETTINGS: SkillsSettings = {
  style: 'grouped-lines',
  columns: 2,
  spacing: 'normal',
};

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  columns: 2,
  cardSize: 'normal',
  showLinks: true,
  showTags: true,
  maxProjects: undefined,
  spacing: 'normal',
};

export const DEFAULT_CERTIFICATION_SETTINGS: CertificationSettings = {
  columns: 3,
  spacing: 'normal',
};

export type BlockSettingsDefaults =
  | typeof DEFAULT_HEADER_SETTINGS
  | typeof DEFAULT_SUMMARY_SETTINGS
  | typeof DEFAULT_EDUCATION_SETTINGS
  | typeof DEFAULT_SKILLS_SETTINGS
  | typeof DEFAULT_PROJECT_SETTINGS
  | typeof DEFAULT_CERTIFICATION_SETTINGS;

export const BLOCK_DEFAULTS: Record<string, BlockSettingsDefaults> = {
  header: DEFAULT_HEADER_SETTINGS,
  summary: DEFAULT_SUMMARY_SETTINGS,
  education: DEFAULT_EDUCATION_SETTINGS,
  skills: DEFAULT_SKILLS_SETTINGS,
  projects: DEFAULT_PROJECT_SETTINGS,
  certifications: DEFAULT_CERTIFICATION_SETTINGS,
};

export function getBlockDefaults<T extends BlockSettingsDefaults>(type: string, overrides: Partial<T> = {}): T {
  const defaults = BLOCK_DEFAULTS[type] as T;
  return { ...defaults, ...overrides } as T;
}

export function mergeSettings<T extends Record<string, unknown>>(type: string, stored: Partial<T> = {}): T {
  const defaults = BLOCK_DEFAULTS[type] as unknown as T;
  return { ...defaults, ...stored } as T;
}