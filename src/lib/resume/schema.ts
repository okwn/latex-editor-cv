import { z } from 'zod';

export const personalSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  role: z.string().min(1, 'Role is required'),
  phone: z.string(),
  email: z.string().email('Invalid email address'),
  github: z.string().url('Invalid GitHub URL').or(z.string().startsWith('github.com/')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional(),
  website: z.string().url('Invalid website URL').optional(),
  location: z.string().optional(),
});

export const summarySchema = z.object({
  professionalSummary: z.string().min(1, 'Professional summary is required'),
});

export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  city: z.string(),
  startYear: z.string(),
  endYear: z.string(),
  status: z.enum(['graduated', 'in-progress', 'dropped']).optional(),
});

export const skillGroupSchema = z.object({
  id: z.string(),
  groupName: z.string().min(1, 'Group name is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Project title is required'),
  yearRange: z.string(),
  linkLabel: z.string(),
  linkUrl: z.string().url('Invalid project URL').or(z.string().startsWith('github.com/')).or(z.string().startsWith('http')).optional(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

export const focusAreasSchema = z.object({
  areas: z.array(z.string()).min(1, 'At least one focus area is required'),
});

export const certificationsSchema = z.object({
  certifications: z.array(z.string()).min(1, 'At least one certification is required'),
});

export const templateSchema = z.object({
  templateId: z.string(),
  templateName: z.string().min(1, 'Template name is required'),
});

export const resumeSchema = z.object({
  personal: personalSchema,
  summary: summarySchema,
  education: z.array(educationSchema),
  skillGroups: z.array(skillGroupSchema),
  projects: z.array(projectSchema),
  focusAreas: z.array(z.string()),
  certifications: z.array(z.string()),
  template: templateSchema,
});

export type ResumeData = z.infer<typeof resumeSchema>;
export type PersonalData = z.infer<typeof personalSchema>;
export type EducationData = z.infer<typeof educationSchema>;
export type SkillGroupData = z.infer<typeof skillGroupSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type TemplateData = z.infer<typeof templateSchema>;

export function validateResumeData(data: unknown) {
  return resumeSchema.safeParse(data);
}

export function safeParseResumeData(data: unknown) {
  const result = resumeSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false as const,
      data: null,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
  return { success: true as const, data: result.data, errors: null };
}