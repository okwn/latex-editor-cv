'use client';

import { useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import {
  exportResumeJson,
  exportLatexSource,
  exportZip,
  isPdfStale,
} from '@/lib/resume/persistence';
import { Download, FileText, FileJson, Archive, AlertTriangle } from 'lucide-react';

export function ExportPanel() {
  const { resumeData, latexSource, pdfUrl, lastPdfUrl, compileStatus } = useEditorStore();
  const [zipLoading, setZipLoading] = useState(false);

  const stale = isPdfStale(latexSource);
  const effectivePdfUrl = lastPdfUrl || pdfUrl;

  const handleExportPdf = useCallback(() => {
    if (!effectivePdfUrl) return;
    window.open(effectivePdfUrl, '_blank');
  }, [effectivePdfUrl]);

  const handleExportLatex = useCallback(() => {
    exportLatexSource(latexSource);
  }, [latexSource]);

  const handleExportJson = useCallback(() => {
    exportResumeJson(resumeData);
  }, [resumeData]);

  const handleExportZip = useCallback(async () => {
    setZipLoading(true);
    try {
      const url = effectivePdfUrl || '';
      await exportZip(url, latexSource, resumeData);
    } finally {
      setZipLoading(false);
    }
  }, [effectivePdfUrl, latexSource, resumeData]);

  const canExportPdf = !!effectivePdfUrl && compileStatus !== 'compiling';

  return (
    <div className="flex flex-col gap-6 text-sm">
      <div>
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
          Export Resume
        </h3>
        <p className="text-zinc-500 text-xs">
          Download your resume in different formats. The ZIP bundle includes everything you need to
          rebuild the document.
        </p>
      </div>

      {/* Stale warning */}
      {stale && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 text-xs font-medium">PDF may be outdated</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              The LaTeX source has changed since the last compile. Exporting the PDF now will give
              you a stale version. Compile again before exporting if you need the latest changes.
            </p>
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="grid grid-cols-2 gap-3">
        <ExportButton
          onClick={handleExportPdf}
          disabled={!canExportPdf}
          icon={<Download size={15} />}
          label="Export PDF"
          description="Latest compiled PDF"
          badge={stale ? 'stale' : undefined}
        />
        <ExportButton
          onClick={handleExportLatex}
          disabled={!latexSource}
          icon={<FileText size={15} />}
          label="Export LaTeX"
          description="main.tex source file"
        />
        <ExportButton
          onClick={handleExportJson}
          disabled={!resumeData}
          icon={<FileJson size={15} />}
          label="Export JSON"
          description="Raw resume data"
        />
        <ExportButton
          onClick={handleExportZip}
          disabled={zipLoading}
          icon={<Archive size={15} />}
          label={zipLoading ? 'Bundling…' : 'Export ZIP'}
          description="PDF + LaTeX + JSON + README"
        />
      </div>

      {/* Last compiled info */}
      {effectivePdfUrl && (
        <div className="text-zinc-600 text-xs">
          Last compiled PDF: <span className="font-mono text-zinc-500">{effectivePdfUrl}</span>
        </div>
      )}
    </div>
  );
}

interface ExportButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
}

function ExportButton({ onClick, disabled, icon, label, description, badge }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all ${
        disabled
          ? 'opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900'
          : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-zinc-300">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
            {badge}
          </span>
        )}
      </div>
      <span className="text-zinc-500 text-xs">{description}</span>
    </button>
  );
}
