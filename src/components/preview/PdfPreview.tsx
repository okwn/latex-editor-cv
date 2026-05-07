'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';
import { useEditorStore } from '@/lib/resume/editorStore';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { parseBlockMappings, mapPdfClickToSource, type BlockMapping, type SyncTeXRecord } from '@/lib/compile/synctex-utils';

interface PdfToolbarProps {
  page: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onReload: () => void;
  onExport: () => void;
  status: 'idle' | 'compiling' | 'success' | 'error';
}

export function PdfToolbar({ page, totalPages, scale, onPageChange, onScaleChange, onReload, onExport, status }: PdfToolbarProps) {
  const scalePresets = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const statusConfig = {
    idle: { label: 'Not compiled', color: 'text-zinc-500', dot: 'bg-zinc-500' },
    compiling: { label: 'Compiling...', color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    success: { label: 'Compiled', color: 'text-green-400', dot: 'bg-green-400' },
    error: { label: 'Failed', color: 'text-red-400', dot: 'bg-red-400' },
  };

  const s = statusConfig[status];

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
      {/* Page nav */}
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1 || totalPages === 0}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs text-zinc-400 min-w-[60px] text-center">
        {totalPages > 0 ? `${page} / ${totalPages}` : '-'}
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

      {/* Zoom controls */}
      <button
        onClick={() => onScaleChange(Math.max(0.25, scale - 0.1))}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
        title="Zoom out"
      >
        <ZoomOut size={13} />
      </button>
      <select
        value={scale}
        onChange={(e) => onScaleChange(parseFloat(e.target.value))}
        className="bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 px-1 py-0.5 cursor-pointer"
      >
        {scalePresets.map((p) => (
          <option key={p} value={p}>{Math.round(p * 100)}%</option>
        ))}
      </select>
      <button
        onClick={() => onScaleChange(Math.min(3, scale + 0.1))}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
        title="Zoom in"
      >
        <ZoomIn size={13} />
      </button>
      <button
        onClick={() => onScaleChange(1)}
        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
        title="Fit to width"
      >
        <Maximize2 size={13} />
      </button>

      <div className="flex-1" />

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 mr-2">
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <span className={`text-xs ${s.color}`}>{s.label}</span>
      </div>

      {/* Actions */}
      <button
        onClick={onReload}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        title="Reload PDF"
      >
        <RotateCcw size={13} />
      </button>
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
  const { pdfUrl, compileStatus, compileErrors, compile, synctexAvailable, compileId, latexSource } = useEditorStore();

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastSuccessfulUrl, setLastSuccessfulUrl] = useState<string | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const prevUrlRef = useRef<string | null>(null);
  const synctexRecordsRef = useRef<SyncTeXRecord[]>([]);
  const blockMappingsRef = useRef<BlockMapping[]>([]);

  // Update block mappings when LaTeX source changes
  useEffect(() => {
    blockMappingsRef.current = parseBlockMappings(latexSource);
  }, [latexSource]);

  // Load SyncTeX data when compileId changes and synctex is available
  useEffect(() => {
    if (!compileId || !synctexAvailable) {
      synctexRecordsRef.current = [];
      return;
    }

    fetch(`/api/compile?action=synctex&compileId=${encodeURIComponent(compileId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.records) {
          synctexRecordsRef.current = data.records;
        }
      })
      .catch(() => {
        synctexRecordsRef.current = [];
      });
  }, [compileId, synctexAvailable]);

  // Load PDF when URL changes
  useEffect(() => {
    if (pdfUrl === prevUrlRef.current) return;
    prevUrlRef.current = pdfUrl;

    const cleanupState = () => {
      setPdfDoc(null);
      setTotalPages(0);
      setPage(1);
    };

    if (!pdfUrl) {
      cleanupState();
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenderError(null);

    import('pdfjs-dist').then(async (pdfjs) => {
      if (cancelled || pdfUrl !== prevUrlRef.current) return;

      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

      try {
        const doc = await pdfjs.getDocument(pdfUrl).promise;
        if (cancelled || pdfUrl !== prevUrlRef.current) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPage(1);
        setLastSuccessfulUrl(pdfUrl);
        setDisplayUrl(pdfUrl);
      } catch {
        if (cancelled || pdfUrl !== prevUrlRef.current) return;
        setRenderError('Failed to load PDF');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    pdfDoc.getPage(page).then((pdfPage) => {
      if (cancelled) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
        canvas,
      };

      const task = pdfPage.render(renderContext);
      renderTaskRef.current = task;

      task.promise.then(() => {
        if (!cancelled) renderTaskRef.current = null;
      }).catch(() => {
        if (!cancelled) renderTaskRef.current = null;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, page, scale]);

  const handleExport = useCallback(() => {
    const url = displayUrl || lastSuccessfulUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv.pdf';
    a.click();
  }, [displayUrl, lastSuccessfulUrl]);

  const handleReload = useCallback(() => {
    if (displayUrl && pdfDoc) {
      // Force re-render of current page
      setPage((p) => p);
    } else if (compileStatus === 'success' && pdfUrl) {
      compile();
    }
  }, [displayUrl, pdfDoc, compileStatus, pdfUrl, compile]);

  const showPlaceholder = !displayUrl && !lastSuccessfulUrl;
  const showErrorOverlay = compileStatus === 'error' && !displayUrl && lastSuccessfulUrl;
  const showCanvas = pdfDoc && !renderError && displayUrl;

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      <PdfToolbar
        page={page}
        totalPages={totalPages}
        scale={scale}
        onPageChange={setPage}
        onScaleChange={setScale}
        onReload={handleReload}
        onExport={handleExport}
        status={compileStatus}
      />

      <div className="flex-1 overflow-auto bg-zinc-800/20 relative">
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-500 mb-1">No PDF generated yet</p>
              <p className="text-xs text-zinc-600">Click &ldquo;Apply to LaTeX&rdquo; then &ldquo;Compile&rdquo;</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Loading PDF...</span>
            </div>
          </div>
        )}

        {showCanvas && (
          <div className="flex items-start justify-center p-4 min-h-full">
            <canvas
              ref={canvasRef}
              className="shadow-xl border border-zinc-700/30 cursor-pointer"
              style={{ maxWidth: '100%' }}
              onClick={(e) => {
                if (!canvasRef.current) return;
                const rect = canvasRef.current.getBoundingClientRect();
                const xNorm = (e.clientX - rect.left) / rect.width;
                const yNorm = (e.clientY - rect.top) / rect.height;

                const result = mapPdfClickToSource(
                  page,
                  xNorm,
                  yNorm,
                  synctexRecordsRef.current.length > 0
                    ? { records: synctexRecordsRef.current, sourcePath: '', hasData: true }
                    : null,
                  blockMappingsRef.current,
                  latexSource
                );

                // Trigger jump in editor via store
                useEditorStore.getState().jumpToLine(result.line);
              }}
            />
          </div>
        )}

        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-red-400">
              <p className="text-sm">{renderError}</p>
            </div>
          </div>
        )}

        {/* Error overlay: keep last successful PDF + show error info */}
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