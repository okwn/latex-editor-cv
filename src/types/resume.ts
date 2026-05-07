import type { ResumeLayout } from './blockLayout';

export interface Personal {
  fullName: string;
  role: string;
  phone: string;
  email: string;
  github: string;
  linkedin?: string;
  website?: string;
  location?: string;
}

export interface Summary {
  professionalSummary: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  city: string;
  startYear: string;
  endYear: string;
  status?: 'graduated' | 'in-progress' | 'dropped';
}

export interface SkillGroup {
  id: string;
  groupName: string;
  skills: string[];
}

export interface Project {
  id: string;
  title: string;
  yearRange: string;
  linkLabel: string;
  linkUrl?: string;
  description: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface FocusAreas {
  areas: string[];
}

export interface Certifications {
  certifications: string[];
}

export type CustomBlockType = 'customText' | 'languages' | 'awards' | 'links' | 'experience' | 'publications' | 'tools' | 'softSkills' | 'courses' | 'openSource' | 'interests' | 'volunteer' | 'patents' | 'talks' | 'caseStudies' | 'references';

export interface CustomTextBlock {
  id: string;
  type: 'customText';
  title: string;
  paragraphs: string[];
}

export interface LanguageBlock {
  id: string;
  type: 'languages';
  title: string;
  items: { language: string; proficiency?: string }[];
}

export interface AwardBlock {
  id: string;
  type: 'awards';
  title: string;
  items: { title: string; issuer?: string; year?: string }[];
}

export interface LinksBlock {
  id: string;
  type: 'links';
  title: string;
  items: { label: string; url: string }[];
}

export interface ExperienceBlock {
  id: string;
  type: 'experience';
  title: string;
  items: { role: string; company: string; period: string; description: string }[];
}

export interface PublicationsBlock {
  id: string;
  type: 'publications';
  title: string;
  items: { title: string; venue: string; year: string; url?: string }[];
}

export interface ToolsBlock {
  id: string;
  type: 'tools';
  title: string;
  items: string[];
}

export interface SoftSkillsBlock {
  id: string;
  type: 'softSkills';
  title: string;
  items: string[];
}

export interface CoursesBlock {
  id: string;
  type: 'courses';
  title: string;
  items: { name: string; issuer?: string; year?: string; url?: string }[];
}

export interface OpenSourceBlock {
  id: string;
  type: 'openSource';
  title: string;
  items: { name: string; description?: string; url?: string; stars?: string }[];
}

export interface InterestsBlock {
  id: string;
  type: 'interests';
  title: string;
  items: string[];
}

export type CustomBlock =
  | CustomTextBlock
  | LanguageBlock
  | AwardBlock
  | LinksBlock
  | ExperienceBlock
  | PublicationsBlock
  | ToolsBlock
  | SoftSkillsBlock
  | CoursesBlock
  | OpenSourceBlock
  | InterestsBlock;

export interface Template {
  templateId: string;
  templateName: string;
}

export interface Resume {
  personal: Personal;
  summary: Summary;
  education: Education[];
  skillGroups: SkillGroup[];
  projects: Project[];
  focusAreas: string[];
  certifications: string[];
  template: Template;
  resumeLayout?: ResumeLayout;
  customBlocks: CustomBlock[];
}