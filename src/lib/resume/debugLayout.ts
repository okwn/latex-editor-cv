/**
 * debugLayout.ts
 *
 * Debug helpers to inspect resume layout state and renderer behavior.
 * Use during development to understand why blocks appear/don't appear in PDF.
 */

import type { Resume } from '@/types/resume';
import type { ResumeLayout, BlockConfig } from '@/types/blockLayout';
import { BLOCK_DEFINITIONS, getActiveBlocksInOrder, getBlocksInOrder } from '@/lib/resume/blockLayout';

export interface LayoutDebugInfo {
  allBlocks: BlockConfig[];
  activeBlocks: BlockConfig[];
  inactiveBlocks: BlockConfig[];
  customBlocks: Array<{ id: string; type: string; title: string }>;
  customBlocksOrder: string[];
  unknownTypes: BlockConfig[];
  renderedTypes: string[];
  skippedBlocks: Array<{ block: BlockConfig; reason: string }>;
}

export function debugLayout(resume: Resume): LayoutDebugInfo {
  const layout: ResumeLayout | undefined = resume.resumeLayout;
  const allBlocks = layout ? getBlocksInOrder(layout) : [];
  const activeBlocks = layout ? getActiveBlocksInOrder(layout) : [];
  const inactiveBlocks = allBlocks.filter((b) => !b.active);
  const customBlocks = resume.customBlocks || [];
  const customBlocksOrder = layout?.customBlocksOrder || [];

  const knownTypes = new Set(Object.keys(BLOCK_DEFINITIONS));
  const unknownTypes = allBlocks.filter((b) => !knownTypes.has(b.type));

  const renderedTypes = activeBlocks.map((b) => b.type);

  const skippedBlocks: Array<{ block: BlockConfig; reason: string }> = [];
  for (const block of allBlocks) {
    if (!block.active) {
      skippedBlocks.push({ block, reason: 'inactive' });
    } else if (!knownTypes.has(block.type)) {
      skippedBlocks.push({ block, reason: `unknown type: ${block.type}` });
    }
  }

  return {
    allBlocks,
    activeBlocks,
    inactiveBlocks,
    customBlocks: customBlocks.map((b) => ({ id: b.id, type: b.type, title: b.title })),
    customBlocksOrder,
    unknownTypes,
    renderedTypes,
    skippedBlocks,
  };
}

export function printLayout(label: string, resume: Resume): void {
  if (process.env.NODE_ENV !== 'development') return;
  const info = debugLayout(resume);
  console.log(`[KCV] ${label}`);
  console.log(`  All blocks (${info.allBlocks.length}):`, info.allBlocks.map((b) => `${b.type}[${b.id.slice(0, 8)}] active=${b.active}`).join(', '));
  console.log(`  Active (${info.activeBlocks.length}):`, info.activeBlocks.map((b) => b.type).join(', '));
  console.log(`  Inactive (${info.inactiveBlocks.length}):`, info.inactiveBlocks.map((b) => b.type).join(', '));
  console.log(`  Custom blocks (${info.customBlocks.length}):`, info.customBlocks.map((b) => `${b.type}[${b.id.slice(0, 8)}]`).join(', '));
  console.log(`  Custom order:`, info.customBlocksOrder.map((id) => id.slice(0, 8)).join(', '));
  if (info.unknownTypes.length) console.log(`  UNKNOWN types:`, info.unknownTypes.map((b) => b.type));
  if (info.skippedBlocks.length) console.log(`  Skipped:`, info.skippedBlocks.map((s) => `${s.block.type} (${s.reason})`).join(', '));
}

export function debugCustomBlocks(resume: Resume): string {
  const blocks = resume.customBlocks || [];
  const order = resume.resumeLayout?.customBlocksOrder || [];
  if (!blocks.length) return 'No custom blocks';
  return blocks
    .map((b) => {
      const pos = order.indexOf(b.id);
      return `${b.type}["${b.title}"][${b.id.slice(0, 8)}] order=${pos >= 0 ? pos : 'unsorted'}`;
    })
    .join('\n');
}