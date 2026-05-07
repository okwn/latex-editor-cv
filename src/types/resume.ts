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
}