import type { Resume } from '@/types/resume';
import type { AiPatch } from '@/lib/ai/aiPatchSchema';
import { safeParseResumeData } from './schema';

/**
 * Represents a before/after diff for a single patch.
 */
export interface PatchDiff {
  patch: AiPatch;
  before: unknown;
  after: unknown;
  status: 'applied' | 'rejected' | 'pending';
}

/**
 * Apply a single patch to resume data following JSON Pointer (RFC 6901) semantics.
 * Paths look like /field or /parent/field or /array/0
 */
export function applyPatch<T extends Record<string, unknown>>(data: T, patch: AiPatch): T {
  const parts = patch.path.split('/').filter(Boolean);
  const result = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    } else if (typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current = {};
      break;
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  const arrayIndex = Number(lastKey);
  const isArrayOp = !isNaN(arrayIndex) && String(arrayIndex) === lastKey;

  if (patch.op === 'remove') {
    if (isArrayOp && parts.length >= 2) {
      const parentKey = parts[parts.length - 2];
      const parent = current[parentKey];
      if (Array.isArray(parent)) {
        (parent as unknown[]).splice(arrayIndex, 1);
      }
    } else if (Array.isArray(current)) {
      current.splice(arrayIndex, 1);
    } else {
      delete current[lastKey];
    }
  } else if (patch.op === 'add' && Array.isArray(current)) {
    current.push(patch.value);
  } else if (patch.op === 'move' && Array.isArray(current)) {
    const [removed] = current.splice(arrayIndex, 1);
    const moveToIndex = patch.value as number;
    current.splice(moveToIndex, 0, removed);
  } else {
    current[lastKey] = patch.value;
  }

  return result as T;
}

/**
 * Apply an array of patches sequentially to a resume.
 */
export function applyPatches<T extends Record<string, unknown>>(data: T, patches: AiPatch[]): T {
  let current = data;
  for (const patch of patches) {
    current = applyPatch(current, patch);
  }
  return current;
}

/**
 * Compute a diff (before/after) for each patch without mutating original data.
 */
export function computePatchDiffs(data: Resume, patches: AiPatch[]): PatchDiff[] {
  return patches.map((patch) => {
    const before = getValueAtPath(data, patch.path);
    let after: unknown;
    try {
      const patched = applyPatch(data as unknown as Record<string, unknown>, patch);
      after = getValueAtPath(patched as unknown as Resume, patch.path);
    } catch {
      after = null;
    }
    return { patch, before, after, status: 'pending' };
  });
}

/**
 * Get a value at a JSON Pointer path from resume data.
 */
export function getValueAtPath(data: Resume, path: string): unknown {
  const parts = path.split('/').filter(Boolean);
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    const arrayIndex = Number(part);
    if (!isNaN(arrayIndex) && Array.isArray(current)) {
      current = current[arrayIndex];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Generate a human-readable label for a patch path.
 */
export function describePatchPath(resumeData: Resume, patch: AiPatch): string {
  const parts = patch.path.split('/').filter(Boolean);
  if (parts.length === 0) return patch.path;
  if (parts.length === 1) {
    const topLevel: Record<string, string> = {
      personal: 'Personal info',
      summary: 'Professional summary',
      education: 'Education entries',
      skillGroups: 'Skill groups',
      projects: 'Projects',
      focusAreas: 'Focus areas',
      certifications: 'Certifications',
      template: 'Template',
    };
    return topLevel[parts[0]] || parts[0];
  }

  const field = parts[parts.length - 1];
  const arrayMatch = parts.find((p) => !isNaN(Number(p)));

  const fieldLabels: Record<string, string> = {
    fullName: 'Full name',
    role: 'Role/title',
    phone: 'Phone',
    email: 'Email',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    website: 'Website',
    location: 'Location',
    professionalSummary: 'Professional summary',
    degree: 'Degree',
    institution: 'Institution',
    city: 'City',
    startYear: 'Start year',
    endYear: 'End year',
    status: 'Status',
    groupName: 'Group name',
    skills: 'Skills',
    title: 'Project title',
    yearRange: 'Year range',
    linkLabel: 'Link label',
    linkUrl: 'Link URL',
    description: 'Description',
    tags: 'Tags',
    priority: 'Priority',
    areas: 'Areas',
    certifications: 'Certifications',
    templateId: 'Template ID',
    templateName: 'Template name',
  };

  const label = fieldLabels[field] || field;

  if (arrayMatch !== undefined) {
    const index = parts.indexOf(arrayMatch);
    const itemType = parts.slice(0, index).join('/').replace(/^\//, '');
    return `${label} (${itemType} #${Number(arrayMatch) + 1})`;
  }

  return label;
}

/**
 * Validate that a patch path is valid for the Resume type.
 */
export function validatePatchPath(patch: AiPatch): { valid: boolean; reason?: string } {
  const parts = patch.path.split('/').filter(Boolean);
  if (parts.length === 0) return { valid: false, reason: 'Path is empty' };

  const topLevelFields = [
    'personal', 'summary', 'education', 'skillGroups',
    'projects', 'focusAreas', 'certifications', 'template',
  ];

  if (!topLevelFields.includes(parts[0])) {
    return { valid: false, reason: `Unknown top-level field: ${parts[0]}` };
  }

  return { valid: true };
}

/**
 * Validate an entire patch set against resume data before applying.
 */
export function validatePatchSet(
  resumeData: Resume,
  patches: AiPatch[]
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const patch of patches) {
    const pathValidation = validatePatchPath(patch);
    if (!pathValidation.valid) {
      errors.push(`${patch.path}: ${pathValidation.reason}`);
    }

    // Guardrail: detect potentially fabricated fields
    const pathParts = patch.path.split('/');
    if (
      (pathParts.includes('education') || pathParts.includes('certifications')) &&
      patch.op === 'add'
    ) {
      warnings.push(
        `Patch at ${patch.path} adds a new entry — verify this is not a fabricated credential.`
      );
    }
  }

  // Try applying to catch structural errors
  try {
    applyPatches(resumeData as unknown as Record<string, unknown>, patches);
  } catch (err) {
    errors.push(`Patch application failed: ${(err as Error).message}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Apply validated patches and return the new resume data.
 * Returns null if validation fails.
 */
export function applyValidatedPatches(
  resumeData: Resume,
  patches: AiPatch[],
  selectedIndices?: number[]
): { success: boolean; data: Resume | null; errors: string[] } {
  const validation = validatePatchSet(resumeData, patches);
  if (!validation.valid) {
    return { success: false, data: null, errors: validation.errors };
  }

  const toApply = selectedIndices !== undefined
    ? patches.filter((_, i) => selectedIndices.includes(i))
    : patches;

  const result = applyPatches(resumeData as unknown as Record<string, unknown>, toApply);
  const resumeResult = result as unknown as Resume;

  // Validate final result against resume schema
  const schemaValidation = safeParseResumeData(resumeResult);
  if (!schemaValidation.success) {
    return {
      success: false,
      data: null,
      errors: (schemaValidation.errors || []).map((e) => `${e.path}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: schemaValidation.data as Resume,
    errors: [],
  };
}
