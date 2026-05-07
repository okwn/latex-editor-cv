import {
  aiPatchSchema,
  aiResponseSchema,
  type AiPatch,
  type AiResponse,
} from './aiPatchSchema';

export { aiPatchSchema, aiResponseSchema, type AiPatch, type AiResponse };

export function validateAiResponse(raw: string): { success: boolean; data: AiResponse | null; errors: string[] } {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, data: null, errors: ['No JSON found in response'] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const result = aiResponseSchema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data, errors: [] };
    }

    return {
      success: false,
      data: null,
      errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  } catch (err) {
    return { success: false, data: null, errors: [(err as Error).message] };
  }
}
