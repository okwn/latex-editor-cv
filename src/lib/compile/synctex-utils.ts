/**
 * Client-safe SyncTeX utilities — no Node.js dependencies.
 * Contains block-level fallback mapping logic.
 */

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
 * Estimate which block a PDF page/position falls into.
 * This is a heuristic based on typical CV layout structure.
 * Returns the block ID and approximate line number.
 */
export function mapPdfPositionToBlock(
  page: number,
  yNorm: number,
  blocks: BlockMapping[]
): { blockId: KcvBlockId; line: number; method: 'block-fallback' } {
  if (page === 1) {
    if (yNorm < 0.15) {
      const block = blocks.find((b) => b.blockId === 'header');
      if (block) return { blockId: 'header', line: block.startLine + 1, method: 'block-fallback' };
    } else if (yNorm < 0.35) {
      const block = blocks.find((b) => b.blockId === 'summary');
      if (block) return { blockId: 'summary', line: block.startLine + 1, method: 'block-fallback' };
    } else if (yNorm < 0.65) {
      const block = blocks.find((b) => b.blockId === 'education');
      if (block) return { blockId: 'education', line: block.startLine + 1, method: 'block-fallback' };
    } else {
      const block = blocks.find((b) => b.blockId === 'skills');
      if (block) return { blockId: 'skills', line: block.startLine + 1, method: 'block-fallback' };
    }
  } else {
    if (yNorm < 0.25) {
      const block = blocks.find((b) => b.blockId === 'projects');
      if (block) return { blockId: 'projects', line: block.startLine + 1, method: 'block-fallback' };
    } else if (yNorm < 0.55) {
      const block = blocks.find((b) => b.blockId === 'focus');
      if (block) return { blockId: 'focus', line: block.startLine + 1, method: 'block-fallback' };
    } else {
      const block = blocks.find((b) => b.blockId === 'certifications');
      if (block) return { blockId: 'certifications', line: block.startLine + 1, method: 'block-fallback' };
    }
  }

  if (blocks.length > 0) {
    return { blockId: blocks[0].blockId, line: blocks[0].startLine + 1, method: 'block-fallback' };
  }

  return { blockId: 'header', line: 1, method: 'block-fallback' };
}

/**
 * Parse plain-text (.synctex, not .gz) file records.
 * The format is documented in SyncTeX specification.
 */
export function parsePlainSyncTex(content: string): SyncTeXRecord[] {
  const records: SyncTeXRecord[] = [];
  const lines = content.split('\n');
  let currentSourceFile = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('Input:')) {
      currentSourceFile = line.replace('Input:', '').trim();
      continue;
    }

    // Records: page h v width height line column
    const parts = line.split(/\s+/);
    if (parts.length >= 7) {
      const page = parseInt(parts[0], 10);
      if (!isNaN(page)) {
        records.push({
          page,
          h: parseFloat(parts[1]) || 0,
          v: parseFloat(parts[2]) || 0,
          width: parseFloat(parts[3]) || 0,
          height: parseFloat(parts[4]) || 0,
          line: parseInt(parts[5], 10) || 1,
          column: parseInt(parts[6], 10) || 1,
          sourceFile: currentSourceFile,
        });
      }
    }
  }

  return records;
}

/**
 * Map a PDF click (page + normalized coords) to a source line.
 *
 * Strategy:
 * 1. If real SyncTeX records are available, find closest record for page+position.
 * 2. Otherwise, use block-level fallback based on KCV-BLOCK markers.
 *
 * This is best-effort — true SyncTeX mapping requires the full binary format
 * which is complex to parse fully in a client-side context.
 */
export function mapPdfClickToSource(
  page: number,
  xNorm: number,
  yNorm: number,
  synctexData: SyncTeXData | null,
  blockMappings: BlockMapping[],
  latexSource: string
): { line: number; blockId: KcvBlockId; method: 'synctex' | 'block-fallback' } {
  // Try synctex first
  if (synctexData && synctexData.hasData && synctexData.records.length > 0) {
    const pageRecords = synctexData.records.filter((r) => r.page === page);
    if (pageRecords.length > 0) {
      let closest = pageRecords[0];
      // Approximate page height in pts (a4 is ~842pt)
      const approxPageHeight = 842;
      const targetV = yNorm * approxPageHeight;
      let minDist = Math.abs(closest.v - targetV);

      for (const record of pageRecords) {
        const dist = Math.abs(record.v - targetV);
        if (dist < minDist) {
          minDist = dist;
          closest = record;
        }
      }

      if (closest.line > 0) {
        return { line: closest.line, blockId: 'header', method: 'synctex' };
      }
    }
  }

  // Fallback to block-level mapping
  const blocks = blockMappings.length > 0 ? blockMappings : parseBlockMappings(latexSource);
  return mapPdfPositionToBlock(page, yNorm, blocks);
}