/**
 * Client-safe SyncTeX utilities — no Node.js dependencies.
 * Contains block-level fallback mapping logic.
 */

import type { ActiveSection } from '@/lib/resume/editorStore';

export type KcvBlockId = 'header' | 'summary' | 'education' | 'skills' | 'projects' | 'focus' | 'certifications';

export interface BlockMapping {
  blockId: KcvBlockId;
  startLine: number;
  endLine: number;
}

export interface SyncTeXRecord {
  page: number;
  v: number;
  h: number;
  width: number;
  height: number;
  line: number;
  column: number;
  sourceFile: string;
}

export interface SyncTeXData {
  records: SyncTeXRecord[];
  sourcePath: string;
  hasData: boolean;
}

const BLOCK_PATTERNS: Record<KcvBlockId, RegExp> = {
  header: /^% KCV-BLOCK: header/m,
  summary: /^% KCV-BLOCK: summary/m,
  education: /^% KCV-BLOCK: education/m,
  skills: /^% KCV-BLOCK: skills/m,
  projects: /^% KCV-BLOCK: projects/m,
  focus: /^% KCV-BLOCK: focus/m,
  certifications: /^% KCV-BLOCK: certifications/m,
};

/** Map KcvBlockId to the corresponding ActiveSection for block-editor navigation. */
export const BLOCK_TO_SECTION: Record<KcvBlockId, ActiveSection> = {
  header: 'personal',
  summary: 'summary',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  focus: 'focusAreas',
  certifications: 'certifications',
};

/** Display labels for each block, used in toasts. */
export const BLOCK_LABEL: Record<KcvBlockId, string> = {
  header: 'Header',
  summary: 'Summary',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  focus: 'Focus Areas',
  certifications: 'Certifications',
};

/**
 * Parse block positions from LaTeX source using KCV-BLOCK markers.
 * Returns block mappings with start/end line numbers.
 */
export function parseBlockMappings(latexSource: string): BlockMapping[] {
  const lines = latexSource.split('\n');
  const blocks: BlockMapping[] = [];
  let currentBlock: { blockId: KcvBlockId; startLine: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [blockId, pattern] of Object.entries(BLOCK_PATTERNS) as [KcvBlockId, RegExp][]) {
      if (pattern.test(line)) {
        if (currentBlock) {
          blocks.push({
            blockId: currentBlock.blockId,
            startLine: currentBlock.startLine,
            endLine: i - 1,
          });
        }
        currentBlock = { blockId, startLine: i };
      }
    }
  }

  if (currentBlock) {
    blocks.push({
      blockId: currentBlock.blockId,
      startLine: currentBlock.startLine,
      endLine: lines.length - 1,
    });
  }

  return blocks;
}

/**
 * Find the line number of a KCV-BLOCK marker by blockId.
 */
export function findBlockLine(latexSource: string, blockId: KcvBlockId): number {
  const lines = latexSource.split('\n');
  const pattern = BLOCK_PATTERNS[blockId];
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return 1;
}

/**
 * Estimate which block a PDF page/position falls into.
 * Uses region-based heuristics on the CV layout.
 *
 * Page 1 layout (approximate):
 *   0–18%   → header (name + role + contact)
 *  18–32%  → summary
 *  32–56%  → education
 *  56–74%  → skills
 *  74–100% → projects / remaining
 *
 * Page 2+ layout:
 *   0–20%   → projects (continued or second page)
 *  20–50%  → focus areas
 *  50–100% → certifications
 *
 * This is a best-effort heuristic — SyncTeX is used when available.
 */
export function mapPdfPositionToBlock(
  page: number,
  yNorm: number,
  blocks: BlockMapping[]
): { blockId: KcvBlockId; line: number; method: 'block-fallback' } {
  if (page === 1) {
    if (yNorm < 0.18) {
      const block = blocks.find((b) => b.blockId === 'header');
      return { blockId: 'header', line: block ? block.startLine + 1 : 1, method: 'block-fallback' };
    }
    if (yNorm < 0.32) {
      const block = blocks.find((b) => b.blockId === 'summary');
      return { blockId: 'summary', line: block ? block.startLine + 1 : 1, method: 'block-fallback' };
    }
    if (yNorm < 0.56) {
      const block = blocks.find((b) => b.blockId === 'education');
      return { blockId: 'education', line: block ? block.startLine + 1 : 1, method: 'block-fallback' };
    }
    if (yNorm < 0.74) {
      const block = blocks.find((b) => b.blockId === 'skills');
      return { blockId: 'skills', line: block ? block.startLine + 1 : 1, method: 'block-fallback' };
    }
    // Remaining top area of page 1 → projects (if present) or skills
    const projBlock = blocks.find((b) => b.blockId === 'projects');
    if (projBlock) return { blockId: 'projects', line: projBlock.startLine + 1, method: 'block-fallback' };
    const skillsBlock = blocks.find((b) => b.blockId === 'skills');
    if (skillsBlock) return { blockId: 'skills', line: skillsBlock.startLine + 1, method: 'block-fallback' };
  } else {
    // Page 2+
    if (yNorm < 0.20) {
      const block = blocks.find((b) => b.blockId === 'projects');
      return { blockId: 'projects', line: block ? block.startLine + 1 : 1, method: 'block-fallback' };
    }
    if (yNorm < 0.50) {
      const block = blocks.find((b) => b.blockId === 'focus');
      return { blockId: 'focus', line: block ? block.startLine + 1 : 1, method: 'block-fallback' };
    }
    const block = blocks.find((b) => b.blockId === 'certifications');
    if (block) return { blockId: 'certifications', line: block.startLine + 1, method: 'block-fallback' };
  }

  // Fallback: return first available block
  if (blocks.length > 0) {
    return { blockId: blocks[0].blockId, line: blocks[0].startLine + 1, method: 'block-fallback' };
  }

  return { blockId: 'header', line: 1, method: 'block-fallback' };
}

/**
 * Map a PDF click (page + normalized coords) to a source line and block.
 *
 * Strategy:
 * 1. If real SyncTeX records are available (and non-empty), use them.
 * 2. Otherwise, use block-level fallback based on KCV-BLOCK markers.
 *
 * This is best-effort. The plain-text SyncTeX format is approximate;
 * real precision requires the binary .synctex.gz format.
 */
export function mapPdfClickToSource(
  page: number,
  xNorm: number,
  yNorm: number,
  synctexData: SyncTeXData | null,
  blockMappings: BlockMapping[],
  latexSource: string
): { line: number; blockId: KcvBlockId; method: 'synctex' | 'block-fallback' } {
  // --- Attempt SyncTeX mapping -----------------------------------------------
  if (synctexData && synctexData.hasData && synctexData.records.length > 0) {
    const pageRecords = synctexData.records.filter((r) => r.page === page);
    if (pageRecords.length > 0) {
      // Convert normalized Y to approximate PDF pts (A4 = 842pt height)
      const targetV = yNorm * 842;
      let closest = pageRecords[0];
      let minDist = Math.abs(closest.v - targetV);

      for (const record of pageRecords) {
        const dist = Math.abs(record.v - targetV);
        if (dist < minDist) {
          minDist = dist;
          closest = record;
        }
      }

      if (closest.line > 0) {
        return {
          line: closest.line,
          blockId: 'header', // SyncTeX doesn't know block IDs — use header as placeholder
          method: 'synctex',
        };
      }
    }
  }

  // --- Fallback: block-level region mapping ---------------------------------
  const blocks = blockMappings.length > 0 ? blockMappings : parseBlockMappings(latexSource);
  return mapPdfPositionToBlock(page, yNorm, blocks);
}