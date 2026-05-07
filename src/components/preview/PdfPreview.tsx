'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Loader2,
  MousePointer2,
  Target,
} from 'lucide-react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { useToast } from '@/components/ui/Toast';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import {
  parseBlockMappings,
  mapPdfClickToSource,
  type BlockMapping,
  type SyncTeXRecord,
  type KcvBlockId,
  BLOCK_TO_SECTION,
  BLOCK_LABEL,
} from '@/lib/compile/synctex-utils';

export const ZOOM_PRESETS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const FIT_WIDTH_TOKEN = -1 as const;
export type ZoomValue = number | typeof FIT_WIDTH_TOKEN;

function isFitWidth(v: ZoomValue): v is typeof FIT_WIDTH_TOKEN {
  return v === FIT_WIDTH_TOKEN;
}

function zoomLabel(v: ZoomValue): string {
  if (isFitWidth(v)) return 'Fit Width';
  return `${Math.round(v * 100)}%`;
}

interface PdfToolbarProps {
  page: number;
  totalPages: number;
  zoom: ZoomValue;
  navMode: 'synctex' | 'approximate';
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: ZoomValue) => void;
  onReload: () => void;
  onExport: () => void;
  status: 'idle' | 'compiling' | 'success' | 'error';
  isRendering: boolean;
}

export function PdfToolbar({
  page,
  totalPages,
  zoom,
  navMode,
  onPageChange,
  onZoomChange,
  onReload,
  onExport,
  status,
  isRendering,
}: PdfToolbarProps) {
  const statusConfig = {
    idle: { label: 'Not compiled', color: 'text-zinc-500', dot: 'bg-zinc-500' },
    compiling: { label: 'Compiling…', color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    success: { label: 'Compiled', color: 'text-green-400', dot: 'bg-green-400' },
    error: { label: 'Failed', color: 'text-red-400', dot: 'bg-red-400' },
  };

  const s = statusConfig[status];

  const zoomIn = () => {
    const presets = ZOOM_PRESETS as readonly number[];
    if (isFitWidth(zoom)) {
      onZoomChange(presets[0]);
      return;
    }
    const next = presets.find((p) => p > zoom);
    onZoomChange(next ?? presets[presets.length - 1]);
  };

  const zoomOut = () => {
    const presets = ZOOM_PRESETS as readonly number[];
    if (isFitWidth(zoom)) {
      onZoomChange(presets[presets.length - 1]);
      return;
    }
    const prev = [...presets].reverse().find((p) => p < zoom);
    onZoomChange(prev ?? presets[0]);
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30 shrink-0">
      {/* Page nav */}
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1 || totalPages === 0}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs text-zinc-400 min-w-[52px] text-center tabular-nums">
        {totalPages > 0 ? `${page} / ${totalPages}` : '—'}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages || totalPages === 0}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Next page"
      >
        <ChevronRight size={14} />
      </button>

      <div className="w-px h-4 bg-zinc-700 mx-1" />

      {/* Zoom out */}
      <button
        onClick={zoomOut}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={13} />
      </button>

      {/* Zoom select */}
      <select
        value={zoom}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onZoomChange(isNaN(v) ? FIT_WIDTH_TOKEN : v);
        }}
        className="bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 px-1.5 py-1 cursor-pointer min-w-[90px] text-center"
      >
        <option value={FIT_WIDTH_TOKEN}>Fit Width</option>
        {ZOOM_PRESETS.map((p) => (
          <option key={p} value={p}>{Math.round(p * 100)}%</option>
        ))}
      </select>

      {/* Zoom in */}
      <button
        onClick={zoomIn}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={13} />
      </button>

      {/* Fit width */}
      <button
        onClick={() => onZoomChange(FIT_WIDTH_TOKEN)}
        className={`p-1 rounded transition-colors ${isFitWidth(zoom) ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
        title="Fit to width"
      >
        <Maximize2 size={13} />
      </button>

      <div className="flex-1" />

      {/* Navigation mode indicator */}
      <div
        className={`flex items-center gap-1 mr-1.5 text-xs px-1.5 py-0.5 rounded ${
          navMode === 'synctex'
            ? 'text-green-400/80 bg-green-400/10'
            : 'text-zinc-500 bg-zinc-800/50'
        }`}
        title={
          navMode === 'synctex'
            ? 'SyncTeX: precise line-level navigation (best effort)'
            : 'Approximate block-level navigation — click to open the corresponding block editor'
        }
      >
        {navMode === 'synctex' ? (
          <Target size={11} />
        ) : (
          <MousePointer2 size={11} />
        )}
        <span className="hidden sm:inline">
          {navMode === 'synctex' ? 'SyncTeX' : 'Block Nav'}
        </span>
      </div>

      {/* Rendering spinner */}
      {isRendering && (
        <Loader2 size={12} className="text-amber-400 animate-spin mr-1" />
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 mr-1">
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <span className={`text-xs ${s.color}`}>{s.label}</span>
      </div>

      {/* Reset view */}
      <button
        onClick={() => onZoomChange(FIT_WIDTH_TOKEN)}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        title="Reset view (Fit Width)"
      >
        <RotateCcw size={12} />
      </button>

      {/* Reload */}
      <button
        onClick={onReload}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        title="Re-compile"
      >
        <RotateCcw size={13} />
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        disabled={status !== 'success'}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
        title="Export PDF"
      >
        <Download size={12} />
        Export
      </button>
    </div>
  );
}

interface PdfPreviewProps {
  className?: string;
}

export function PdfPreview({ className }: PdfPreviewProps) {
  const toast = useToast();
  const {
    pdfUrl,
    compileStatus,
    compileErrors,
    compile,
    synctexAvailable,
    compileId,
    latexSource,
    pdfVersion,
    setActiveSection,
    setEditorMode,
  } = useEditorStore();

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState<ZoomValue>(FIT_WIDTH_TOKEN);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [navMode, setNavMode] = useState<'synctex' | 'approximate'>('approximate');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const prevUrlRef = useRef<string | null>(null);
  const synctexRecordsRef = useRef<SyncTeXRecord[]>([]);
  const blockMappingsRef = useRef<BlockMapping[]>([]);
  const [lastSuccessfulUrl, setLastSuccessfulUrl] = useState<string | null>(null);

  // Measure container width for fit-width calculation
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update block mappings when LaTeX source changes
  useEffect(() => {
    blockMappingsRef.current = parseBlockMappings(latexSource);
  }, [latexSource]);

  // Load SyncTeX data when compileId changes
  useEffect(() => {
    if (!compileId || !synctexAvailable) {
      synctexRecordsRef.current = [];
      return;
    }
    fetch(`/api/compile?action=synctex&compileId=${encodeURIComponent(compileId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.records && data.records.length > 0) {
          synctexRecordsRef.current = data.records;
          setNavMode('synctex');
        } else {
          synctexRecordsRef.current = [];
          setNavMode('approximate');
        }
      })
      .catch(() => {
        synctexRecordsRef.current = [];
        setNavMode('approximate');
      });
  }, [compileId, synctexAvailable]);

  // Load PDF when pdfUrl + pdfVersion changes
  useEffect(() => {
    const url = pdfUrl;
    if (!url) return;
    if (url === prevUrlRef.current) return;
    prevUrlRef.current = url;

    let cancelled = false;
    setIsLoadingPdf(true);
    setRenderError(null);

    import('pdfjs-dist').then(async (pdfjs) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

      try {
        const doc = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPage(1);
        setLastSuccessfulUrl(url);
        setDisplayUrl(url);
      } catch {
        if (!cancelled) setRenderError('Failed to load PDF');
      } finally {
        if (!cancelled) setIsLoadingPdf(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, pdfVersion]);

  // Reset document state when PDF URL is cleared
  useEffect(() => {
    if (pdfUrl) return;
    setPdfDoc(null);
    setTotalPages(0);
    setPage(1);
    setDisplayUrl(null);
  }, [pdfUrl]);

  // Calculate effective scale from zoom + container
  const getEffectiveScale = useCallback(async (): Promise<number> => {
    if (!pdfDoc || !wrapperRef.current) return 1;
    const pdfPage = await pdfDoc.getPage(page);
    const baseViewport = pdfPage.getViewport({ scale: 1 });
    if (isFitWidth(zoom)) {
      const availableWidth = containerWidth - 32; // padding
      const scale = Math.max(0.25, availableWidth / baseViewport.width);
      return scale;
    }
    return zoom;
  }, [pdfDoc, zoom, page, containerWidth]);

  // Render the current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !wrapperRef.current) return;

    let cancelled = false;
    setIsRendering(true);

    const doRender = async () => {
      const pdfPage = await pdfDoc.getPage(page);
      if (cancelled) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const baseViewport = pdfPage.getViewport({ scale: 1 });
      let effectiveScale = 1;
      if (isFitWidth(zoom)) {
        const availableWidth = (wrapperRef.current?.clientWidth ?? containerWidth) - 32;
        effectiveScale = Math.max(0.25, availableWidth / baseViewport.width);
      } else {
        effectiveScale = zoom;
      }

      const dpr = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: effectiveScale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      canvas.width = Math.round(viewport.width * dpr);
      canvas.height = Math.round(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const renderContext = {
        canvasContext: context,
        viewport,
        canvas,
        transform: [dpr, 0, 0, dpr, 0, 0] as [number, number, number, number, number, number],
      };

      const task = pdfPage.render(renderContext);
      renderTaskRef.current = task;

      try {
        await task.promise;
      } catch {
        // Cancelled or error
      } finally {
        if (!cancelled) setIsRendering(false);
        renderTaskRef.current = null;
      }
    };

    doRender();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, page, zoom, containerWidth, totalPages]);

  const handleExport = useCallback(() => {
    const url = displayUrl || lastSuccessfulUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv.pdf';
    a.click();
  }, [displayUrl, lastSuccessfulUrl]);

  const handleReload = useCallback(() => {
    if (compileStatus === 'success' && pdfUrl) compile();
  }, [compileStatus, pdfUrl, compile]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width;
      const yNorm = (e.clientY - rect.top) / rect.height;

      const synctexData =
        synctexRecordsRef.current.length > 0
          ? { records: synctexRecordsRef.current, sourcePath: '', hasData: true }
          : null;

      const result = mapPdfClickToSource(
        page,
        xNorm,
        yNorm,
        synctexData,
        blockMappingsRef.current,
        latexSource
      );

      const section = BLOCK_TO_SECTION[result.blockId as KcvBlockId];
      const label = BLOCK_LABEL[result.blockId as KcvBlockId] ?? result.blockId;

      if (result.method === 'synctex') {
        setEditorMode('latex');
        useEditorStore.getState().jumpToLine(result.line);
        toast({ message: `SyncTeX: jumped to line ${result.line}`, type: 'info', duration: 2000 });
      } else {
        setActiveSection(section);
        toast({ message: `Jumped to ${label} block`, type: 'info', duration: 2000 });
      }
    },
    [page, latexSource, setActiveSection, setEditorMode, toast]
  );

  const showPlaceholder = !displayUrl && !lastSuccessfulUrl;
  const showErrorOverlay = compileStatus === 'error' && !displayUrl && !!lastSuccessfulUrl;
  const showCanvas = !!(pdfDoc && !renderError && displayUrl);
  const showLoadingPdf = isLoadingPdf;
  const showRenderingPage = isRendering && !showLoadingPdf && showCanvas;

  return (
    <div className={`flex flex-col h-full ${className ?? ''}`}>
      <PdfToolbar
        page={page}
        totalPages={totalPages}
        zoom={zoom}
        navMode={navMode}
        onPageChange={setPage}
        onZoomChange={setZoom}
        onReload={handleReload}
        onExport={handleExport}
        status={compileStatus}
        isRendering={showRenderingPage}
      />

      {/*
        Wrapper uses overflow-auto so:
        - When canvas is smaller than container (Fit Width), canvas stays centered
        - When canvas exceeds container size (high zoom), both axes scroll
        min-h-0 is critical in flex column context to allow internal scroll
      */}
      <div
        ref={wrapperRef}
        className="flex-1 overflow-auto min-h-0 relative"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* No PDF yet */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-500 mb-1">No PDF generated yet</p>
              <p className="text-xs text-zinc-600">Click &ldquo;Compile&rdquo; to generate PDF</p>
            </div>
          </div>
        )}

        {/* Loading PDF */}
        {showLoadingPdf && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Loading PDF…</span>
            </div>
          </div>
        )}

        {/* Rendering indicator */}
        {showRenderingPage && (
          <div className="sticky top-2 left-1/2 z-10 flex items-center gap-1.5 bg-zinc-900/80 px-2 py-1 rounded-md w-max mx-auto">
            <div className="w-3 h-3 border border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400">Rendering…</span>
          </div>
        )}

        {/* PDF canvas — wrapper allows scroll when canvas exceeds container */}
        {showCanvas && (
          <div className="flex items-start justify-center p-4">
            <canvas
              ref={canvasRef}
              className="shadow-xl border border-zinc-700/30 cursor-pointer bg-white"
              onClick={handleCanvasClick}
            />
          </div>
        )}

        {/* Render error */}
        {renderError && !showLoadingPdf && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-red-400">
              <p className="text-sm">{renderError}</p>
            </div>
          </div>
        )}

        {/* Compile failed overlay */}
        {showErrorOverlay && (
          <div className="absolute inset-0 bg-zinc-950/70 z-10 flex items-start justify-center pt-8">
            <div className="bg-zinc-900 border border-red-500/30 rounded-lg p-4 max-w-sm mx-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="text-red-400 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400 mb-1">Compilation Failed</p>
                  {compileErrors.length > 0 ? (
                    <ul className="space-y-1">
                      {compileErrors.slice(0, 3).map((err, i) => (
                        <li key={i} className="text-xs text-zinc-400">
                          {err.line ? `Line ${err.line}: ` : ''}{err.message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400">Unknown error. Check the LaTeX source.</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Previous PDF is still visible.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}