'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { EditorShell } from '@/components/layout/EditorShell';
import { AppIconRail } from '@/components/layout/AppIconRail';
import { BlockEditorRouter } from '@/components/blocks/BlockEditorRouter';
import { BlockStorePanel } from '@/components/blocks/BlockStorePanel';
import { useEditorStore } from '@/lib/resume/editorStore';
import { normalizeBlockLayout } from '@/lib/resume/blockLayout';
import { useKeyboardShortcuts } from '@/components/ui/useKeyboardShortcuts';
import { useToast } from '@/components/ui/Toast';
import { ToastContainer } from '@/components/ui/Toast';
import { AutoCompileManager } from '@/components/editor/AutoCompileManager';
import { PdfPreviewSkeleton, EditorSkeleton } from '@/components/ui/Skeletons';
import { AiDrawer } from '@/components/layout/AiDrawer';
import {
  getCvDocument,
  updateCvDocument,
  touchCvDocumentCompile,
} from '@/lib/resume/documentStore';

const LatexEditor = dynamic(
  () => import('@/components/editor/LatexEditor').then((m) => m.LatexEditor),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

const PdfPreviewPanel = dynamic(
  () => import('@/components/preview/PdfPreview').then((m) => m.PdfPreview),
  { ssr: false, loading: () => <PdfPreviewSkeleton /> }
);

const PANEL_LAYOUT_KEY = 'kcv-editor-panels';

interface PanelLayout {
  showLatex: boolean;
  showPreview: boolean;
  showBlocks: boolean;
}

function loadLayout(): PanelLayout {
  try {
    const raw = localStorage.getItem(PANEL_LAYOUT_KEY);
    if (!raw) return { showLatex: false, showPreview: true, showBlocks: true };
    return JSON.parse(raw);
  } catch {
    return { showLatex: false, showPreview: true, showBlocks: true };
  }
}

function saveLayout(layout: PanelLayout) {
  try {
    localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(layout));
  } catch { /* ignore */ }
}

function SidebarIcon({ section, active, onClick }: {
  section: { id: string; label: string; icon: React.ComponentType<{ size: number; className?: string }> };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center py-2.5 rounded transition-all ${
        active
          ? 'bg-amber-500/10 text-amber-400'
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
      }`}
      title={section.label}
    >
      <Icon size={16} className={active ? 'text-amber-400' : ''} />
    </button>
  );
}

function IconRail({ cvId, onSnapshot }: { cvId: string; onSnapshot: () => void }) {
  const { activeSection, setActiveSection, toggleAiDrawer } = useEditorStore();

  const sections = [
    { id: 'personal', label: 'Header', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )},
    { id: 'summary', label: 'Summary', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    )},
    { id: 'education', label: 'Education', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    )},
    { id: 'skills', label: 'Skills', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    )},
    { id: 'projects', label: 'Projects', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
    )},
    { id: 'focusAreas', label: 'Focus Areas', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    )},
    { id: 'certifications', label: 'Certifications', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
    )},
    { id: 'export', label: 'Export', icon: ({ size, className }: { size: number; className?: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    )},
  ];

  return (
    <div className="w-10 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-2 gap-1 shrink-0">
      {sections.map((s) => (
        <SidebarIcon key={s.id} section={s} active={activeSection === s.id} onClick={() => setActiveSection(s.id as typeof activeSection)} />
      ))}
      <div className="flex-1" />
      <button
        onClick={onSnapshot}
        className="p-2 rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        title="Take Snapshot"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <button
        onClick={toggleAiDrawer}
        className="p-2 rounded text-zinc-500 hover:bg-zinc-800 hover:text-amber-400 transition-colors"
        title="AI Assistant"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>
  );
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = typeof params.cvId === 'string' ? params.cvId : params.cvId?.[0] ?? '';

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cvTitle, setCvTitle] = useState('Untitled CV');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showLatex, setShowLatex] = useState(() => loadLayout().showLatex);
  const [showPreview, setShowPreview] = useState(() => loadLayout().showPreview);
  const [showBlocks, setShowBlocks] = useState(() => loadLayout().showBlocks);
  const [showBlockStore, setShowBlockStore] = useState(false);

  const {
    editorMode,
    setEditorMode,
    latexSource,
    resumeData,
    pdfUrl,
    compileId,
    setResumeData,
    setLatexSource,
    setCurrentTemplateId,
  } = useEditorStore();

  const toast = useToast();

  useEffect(() => {
    if (!cvId) { setNotFound(true); setLoading(false); return; }
    const doc = getCvDocument(cvId);
    if (!doc) { setNotFound(true); setLoading(false); return; }
    setCvTitle(doc.title);
    setResumeData(normalizeBlockLayout(doc.resumeData));
    setLatexSource(doc.latexSource);
    setCurrentTemplateId(doc.templateId);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvId]);

  useEffect(() => {
    if (!cvId || loading) return;
    const timer = setTimeout(() => {
      const current = getCvDocument(cvId);
      if (!current) return;
      updateCvDocument(cvId, { resumeData, latexSource });
    }, 1000);
    return () => clearTimeout(timer);
  }, [cvId, resumeData, latexSource, loading]);

  useEffect(() => {
    if (!cvId || loading || !pdfUrl || !compileId) return;
    touchCvDocumentCompile(cvId, pdfUrl);
  }, [cvId, pdfUrl, compileId, loading]);

  const handleBack = useCallback(() => router.push('/dashboard'), [router]);

  const handleToggleLatex = useCallback(() => {
    setShowLatex((v) => {
      const next = !v;
      if (!next && !showPreview && showBlocks) {
        toast({ message: 'At least one editor panel must remain open', type: 'warning' });
        return v;
      }
      saveLayout({ showLatex: next, showPreview, showBlocks });
      return next;
    });
  }, [showPreview, showBlocks, toast]);

  const handleTogglePreview = useCallback(() => {
    setShowPreview((v) => {
      const next = !v;
      if (!next && showLatex && !showBlocks) {
        toast({ message: 'At least one editor panel must remain open', type: 'warning' });
        return v;
      }
      saveLayout({ showLatex, showPreview: next, showBlocks });
      return next;
    });
  }, [showLatex, showBlocks, toast]);

  const handleToggleBlocks = useCallback(() => {
    setShowBlocks((v) => {
      const next = !v;
      if (!next && !showLatex && showPreview) {
        toast({ message: 'At least one editor panel must remain open', type: 'warning' });
        return v;
      }
      saveLayout({ showLatex, showPreview, showBlocks: next });
      return next;
    });
  }, [showLatex, showPreview, toast]);

  const handleTitleClick = useCallback(() => {
    setTitleDraft(cvTitle);
    setEditingTitle(true);
  }, [cvTitle]);

  const handleTitleSave = useCallback(() => {
    if (titleDraft.trim()) {
      setCvTitle(titleDraft.trim());
      if (!loading) {
        const current = getCvDocument(cvId);
        if (current) updateCvDocument(cvId, { title: titleDraft.trim() });
      }
    }
    setEditingTitle(false);
  }, [titleDraft, cvId, loading]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') setEditingTitle(false);
  }, [handleTitleSave]);

  useKeyboardShortcuts({ onTogglePreview: handleTogglePreview, onToggleLatex: handleToggleLatex, onToggleBlocks: handleToggleBlocks });

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading CV…</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-zinc-200 mb-1">CV not found</h2>
          <p className="text-sm text-zinc-500">This CV may have been deleted.</p>
        </div>
        <button onClick={handleBack} className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm transition-colors">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <EditorShell
      cvId={cvId}
      cvTitle={cvTitle}
      editorMode={editorMode}
      onEditorModeChange={setEditorMode}
      showLatex={showLatex}
      onToggleLatex={handleToggleLatex}
      showPreview={showPreview}
      onTogglePreview={handleTogglePreview}
      showBlocks={showBlocks}
      onToggleBlocks={handleToggleBlocks}
      onBack={handleBack}
    >
      <Group orientation="horizontal">
        {/* Sidebar icon rail */}
        <Panel id="sidebar" defaultSize={5} minSize={4} maxSize={8} collapsible>
          <AppIconRail
            showBlocks={showBlocks}
            onToggleBlocks={handleToggleBlocks}
            showPreview={showPreview}
            onTogglePreview={handleTogglePreview}
            showBlockStore={showBlockStore}
            onToggleBlockStore={() => setShowBlockStore((v) => !v)}
          />
        </Panel>

        <Separator className="w-1 bg-zinc-800 hover:bg-amber-500/40 transition-colors cursor-col-resize flex items-center justify-center">
          <div className="w-px h-8 bg-zinc-600/50" />
        </Separator>

        {/* Block editor — only when visible */}
        {showBlocks && (
          <>
            <Panel id="blocks" defaultSize={28} minSize={18} maxSize={40} collapsible collapsedSize={0}>
              <div className="h-full overflow-y-auto min-w-0">
                <div className="p-3">
                  <BlockEditorRouter />
                </div>
              </div>
            </Panel>
            {showLatex && (
              <Separator className="w-1 bg-zinc-800 hover:bg-amber-500/40 transition-colors cursor-col-resize flex items-center justify-center">
                <div className="w-px h-8 bg-zinc-600/50" />
              </Separator>
            )}
          </>
        )}

        {/* LaTeX editor — only when visible */}
        {showLatex && (
          <>
            {!showBlocks && (
              <Separator className="w-1 bg-zinc-800 hover:bg-amber-500/40 transition-colors cursor-col-resize flex items-center justify-center">
                <div className="w-px h-8 bg-zinc-600/50" />
              </Separator>
            )}
            <Panel id="latex" defaultSize={28} minSize={15}>
              <div className="h-full flex flex-col min-w-0 overflow-hidden border-l border-zinc-800">
                <div className="flex-1 overflow-hidden">
                  <LatexEditor />
                </div>
              </div>
            </Panel>
            {showPreview && (
              <Separator className="w-1 bg-zinc-800 hover:bg-amber-500/40 transition-colors cursor-col-resize flex items-center justify-center">
                <div className="w-px h-8 bg-zinc-600/50" />
              </Separator>
            )}
          </>
        )}

        {/* PDF preview — only when visible */}
        {showPreview && (
          <Panel id="preview" defaultSize={showLatex ? 30 : 40} minSize={15} maxSize={65}>
            <div className="h-full flex flex-col border-l border-zinc-800">
              <PdfPreviewPanel />
            </div>
          </Panel>
        )}
      </Group>

      <AiDrawer />
      <AutoCompileManager />
      <ToastContainer />

      {/* Block store panel */}
      {showBlockStore && (
        <div className="absolute left-10 top-0 bottom-0 z-[60] w-72 bg-zinc-900 border-r border-zinc-700 shadow-2xl flex flex-col">
          <BlockStorePanel onClose={() => setShowBlockStore(false)} />
        </div>
      )}

      {/* Title rename modal */}
      {editingTitle && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingTitle(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">Rename CV</h3>
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTitle(false)} className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleTitleSave} className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </EditorShell>
  );
}