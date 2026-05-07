'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { parseBlockMappings, mapPdfClickToSource, type BlockMapping } from '@/lib/compile/synctex-utils';

interface PdfClickPosition {
  page: number;
  xNorm: number;  // 0-1, normalized x position
  yNorm: number;  // 0-1, normalized y position from top
}

/**
 * Hook for PDF click-to-source navigation.
 *
 * Usage:
 * const { handlePdfClick, available } = usePdfSourceNavigation();
 * <canvas onClick={(e) => handlePdfClick(e, canvasElement)} />
 */
export function usePdfSourceNavigation() {
  const { latexSource, jumpToLine, pdfUrl } = useEditorStore();
  const blockMappingsRef = useRef<BlockMapping[]>([]);

  // Compute block mappings once when latex changes
  const getBlockMappings = useCallback((): BlockMapping[] => {
    if (blockMappingsRef.current.length === 0) {
      blockMappingsRef.current = parseBlockMappings(latexSource);
    }
    return blockMappingsRef.current;
  }, [latexSource]);

  /**
   * Handle a click on the PDF canvas.
   * Extracts page/position and maps to source line.
   */
  const handlePdfClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const xNorm = (event.clientX - rect.left) / rect.width;
      const yNorm = (event.clientY - rect.top) / rect.height;

      // Page number is tracked by the PDF viewer state.
      // We store the current page in the store or read it from the viewer.
      // For now, we use a heuristic: page 1 for top half, page 2+ for bottom.
      // This will be refined when we wire up the actual page tracking.
      const page = 1; // placeholder — actual implementation uses viewer state

      const result = mapPdfClickToSource(
        page,
        xNorm,
        yNorm,
        null,  // synctexData not available without server round-trip
        getBlockMappings(),
        latexSource
      );

      jumpToLine(result.line);
    },
    [latexSource, jumpToLine, getBlockMappings]
  );

  /**
   * Refresh block mappings when LaTeX source changes.
   */
  const refreshMappings = useCallback(() => {
    blockMappingsRef.current = parseBlockMappings(latexSource);
  }, [latexSource]);

  return {
    handlePdfClick,
    refreshMappings,
    getBlockMappings,
  };
}

/**
 * Calculate normalized click position from a canvas element.
 */
export function normalizeClickPosition(
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): { xNorm: number; yNorm: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    xNorm: (event.clientX - rect.left) / rect.width,
    yNorm: (event.clientY - rect.top) / rect.height,
  };
}

/**
 * Estimate page number from normalized Y position.
 * This is a simple heuristic — actual page tracking should
 * come from the pdfjs page state.
 *
 * Assumes standard page breaks for a typical CV layout.
 */
export function estimatePageFromY(yNorm: number, totalPages: number): number {
  if (totalPages <= 1) return 1;
  if (yNorm < 0.5) return 1;
  if (totalPages === 2) return yNorm < 0.75 ? 1 : 2;
  return Math.min(totalPages, Math.ceil((yNorm * totalPages)));
}