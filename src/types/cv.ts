import type { Resume } from '@/types/resume';

/**
 * A stored CV document — persisted to localStorage.
 */
export interface CvDocument {
  id: string;
  title: string;
  templateId: string;
  resumeData: Resume;
  latexSource: string;
  createdAt: string;
  updatedAt: string;
  lastCompiledAt?: string;
  lastPdfUrl?: string;
}

/** Minimal template descriptor shown in the dashboard template picker. */
export interface TemplateCard {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
}