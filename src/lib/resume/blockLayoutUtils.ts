import type { Resume } from '@/types/resume';
import type { ResumeLayout, BlockConfig } from '@/types/blockLayout';
import { updateBlockSettings } from '@/lib/resume/blockLayout';

export function updateBlockSettingsInResume(
  resume: Resume,
  blockId: string,
  settings: Record<string, unknown>
): Resume {
  if (!resume.resumeLayout) return resume;
  const newLayout = updateBlockSettings(resume.resumeLayout, blockId, settings);
  return { ...resume, resumeLayout: newLayout };
}