import type { Resume } from '@/types/resume';

/**
 * Template support flags — describes which resume features
 * a template can render.
 */
export interface TemplateSupports {
  projects: boolean;
  certifications: boolean;
  focusAreas: boolean;
  twoColumnProjects: boolean;
  twoColumnEducation: boolean;
}

/**
 * A registered LaTeX CV template.
 *
 * Add new templates by:
 * 1. Creating a new file in src/lib/templates/ with a render function
 * 2. Calling registerTemplate() at the bottom of that file
 */
export interface Template {
  /** Unique ID, e.g. "kcv-modern" */
  id: string;
  /** Display name */
  name: string;
  /** Short description shown in the selector */
  description: string;
  /**
   * Renders resume JSON into a full .tex string.
   * All user-generated text must be LaTeX-escaped.
   */
  render: (resume: Resume) => string;
  /** Feature support flags */
  supports: TemplateSupports;
}

/**
 * All registered templates.
 * Populated by calls to registerTemplate() during module evaluation.
 */
export const TEMPLATES: Template[] = [];

/**
 * Register a template. Called at module evaluation time by template files.
 * Templates are deduplicated by ID — last registration wins.
 */
export function registerTemplate(template: Template): void {
  const idx = TEMPLATES.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    TEMPLATES[idx] = template;
  } else {
    TEMPLATES.push(template);
  }
}

/**
 * Look up a template by its ID.
 * Returns undefined if not found.
 */
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Default template ID used for new resumes.
 */
export const DEFAULT_TEMPLATE_ID = 'kcv-modern';
