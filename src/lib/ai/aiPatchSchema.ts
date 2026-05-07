import { z } from 'zod';

/**
 * AI patch operations supported by KCV.
 * - replace: replace a value at the given path
 * - add: add an item to an array
 * - remove: remove an item from an array or delete a field
 * - move: move an array item to a different index (same array, reorders)
 */
export const aiPatchOpSchema = z.enum(['replace', 'add', 'remove', 'move']);

export const aiPatchSchema = z.object({
  op: aiPatchOpSchema,
  path: z.string().regex(
    /^\/[\w]+(\/[\w]+)*(\/\d+)?$/,
    'Path must be like /field or /parent/field or /array/0'
  ),
  value: z.unknown(),
});

export const aiResponseSchema = z.object({
  summary: z.string(),
  patches: z.array(aiPatchSchema),
  warnings: z.array(z.string()).default([]),
  suggestedAdditions: z.array(z.object({
    path: z.string(),
    value: z.unknown(),
    reason: z.string(),
  })).optional(),
});

export type AiPatchOp = z.infer<typeof aiPatchOpSchema>;
export type AiPatch = z.infer<typeof aiPatchSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;

/**
 * Valid resume top-level paths (for guardrail validation)
 */
export const RESUME_VALID_PATHS = [
  '/personal',
  '/summary',
  '/education',
  '/skillGroups',
  '/projects',
  '/focusAreas',
  '/certifications',
  '/template',
] as const;

export type ResumeValidPath = typeof RESUME_VALID_PATHS[number];

/**
 * Fields that are never safe for AI to fabricate or modify silently.
 * Any patch targeting these must include a warning.
 */
export const FABRICATION_GUARDRAIL_FIELDS: string[] = [
  'degree',
  'institution',
  'status',
  'certifications',
];

export const INVENTED_ADDITION_WARNING = 'SUGGESTED: This patch adds new content not present in the original resume — user should verify accuracy before applying.';
