import { create } from 'zustand';
import { Resume } from '@/types/resume';
import { defaultResume } from '@/lib/resume/defaultResume';
import { normalizeBlockLayout } from '@/lib/resume/blockLayout';
import { TEMPLATES, getTemplate, DEFAULT_TEMPLATE_ID } from '@/lib/templates/templateRegistry';
// Import kcvModernTemplate to trigger its registerTemplate() side-effect
import '@/lib/templates/kcvModernTemplate';
import {
  checksumLatex,
  setLastCompiledHash,
  setLastPdfUrl,
  getLastPdfUrl,
  getPersistedTemplateId,
  setPersistedTemplateId,
} from '@/lib/resume/persistence';

export type EditorMode = 'blocks' | 'latex';

export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

export interface CompileError {
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  raw?: string;
}

export type ActiveSection =
  | 'personal'
  | 'summary'
  | 'education'
  | 'skills'
  | 'projects'
  | 'focusAreas'
  | 'certifications'
  | 'template'
  | 'snapshots'
  | 'export';

interface EditorState {
  // Resume data
  resumeData: Resume;
  // LaTeX source
  latexSource: string;
  // Editor mode: "blocks" = regenerate LaTeX from blocks before compile; "latex" = use latexSource directly
  editorMode: EditorMode;
  // Dirty tracking
  isDirty: boolean;
  dirtyReason: string | null;
  // Compile state
  compileStatus: CompileStatus;
  compileErrors: CompileError[];
  // Hash tracking for cache busting
  lastGeneratedLatexHash: string | null;
  lastCompiledLatexHash: string | null;
  lastCompiledAt: number | null;
  // PDF state
  pdfUrl: string | null;
  pdfVersion: number;
  // Selection
  selectedBlockId: string | null;
  activeSection: ActiveSection;
  // UI
  aiDrawerOpen: boolean;
  rawLatexMode: boolean;
  showLatexPanel: boolean;
  aiContext: string | null;
  compileId: string | null;
  synctexAvailable: boolean;
  autoCompileAfterAi: boolean;
  currentTemplateId: string;
  lastPdfUrl: string | null;
  // Auto compile
  autoCompileEnabled: boolean;
  isAutoCompileWaiting: boolean;
  // Left panel tab state: navigate=list, layout=edit, add=block store
  activeLeftTab: 'navigate' | 'layout' | 'add';
  // Actions
  setResumeData: (resume: Resume) => void;
  updateResumeData: (updater: (prev: Resume) => Resume) => void;
  setLatexSource: (source: string) => void;
  setSelectedBlockId: (id: string | null) => void;
  setActiveSection: (section: ActiveSection) => void;
  setCompileStatus: (status: CompileStatus) => void;
  setCompileErrors: (errors: CompileError[]) => void;
  toggleAiDrawer: () => void;
  toggleRawLatexMode: () => void;
  setAutoCompileAfterAi: (enabled: boolean) => void;
  setCurrentTemplateId: (id: string) => void;
  generateFromBlocks: () => void;
  regenerateLatexFromBlocks: () => void;
  resetToTemplate: () => void;
  compile: () => Promise<void>;
  compileCurrent: () => Promise<void>;
  exportPdf: () => Promise<void>;
  jumpToLine: (line: number) => void;
  navigateToBlock: (blockId: string) => void;
  askAiToFix: (error: CompileError) => void;
  clearAiContext: () => void;
  setEditorMode: (mode: EditorMode) => void;
  markDirty: (reason: string) => void;
  setShowLatexPanel: (show: boolean) => void;
  toggleShowLatexPanel: () => void;
  setAutoCompileEnabled: (enabled: boolean) => void;
  toggleAutoCompile: () => void;
  setIsAutoCompileWaiting: (waiting: boolean) => void;
  setActiveLeftTab: (tab: 'navigate' | 'layout' | 'add') => void;
  bootstrap: () => void;
}

/**
 * Returns a valid template ID, falling back to DEFAULT_TEMPLATE_ID if needed.
 * Never returns null/undefined — always a string.
 */
export function ensureValidTemplateId(templateId: string | null | undefined): string {
  if (templateId && getTemplate(templateId)) return templateId;
  // Try default
  if (getTemplate(DEFAULT_TEMPLATE_ID)) return DEFAULT_TEMPLATE_ID;
  // Last resort: any available template
  if (TEMPLATES.length > 0) return TEMPLATES[0].id;
  // Emergency: return hardcoded default even if not registered
  return DEFAULT_TEMPLATE_ID;
}

/**
 * Safe render — never throws. Returns LaTeX string or emergency fallback.
 */
export function renderWithTemplate(resume: Resume, templateId: string | null | undefined): string {
  const validId = ensureValidTemplateId(templateId ?? null);
  const tpl = getTemplate(validId);
  if (tpl) return tpl.render(resume);

  // Emergency fallback — template system completely broken
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.65in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{xcolor}
\\usepackage{parskip}
\\definecolor{kcvprimary}{HTML}{111827}
\\definecolor{kcvaccent}{HTML}{2563EB}
\\hypersetup{colorlinks=true,linkcolor=kcvaccent,urlcolor=kcvaccent}

\\begin{document}
\\raggedright

{\\LARGE\\textbf\\color{kcvprimary}{${resume.personal?.fullName ?? 'CV Maker'}}\\\\}
\\textit\\large\\color{gray}{${resume.personal?.role ?? ''}}\\\\[1em]

{\\bfseries Resume data loaded.}\\\\
{\\small Template unavailable — using fallback mode.}

\\vspace{1em}
\\textit{Please check your template configuration.}
\\end{document}`;
}

// Bootstrap token — set to true after first render to avoid infinite loop
let bootstrapDone = false;
const bootstrapDoneRef = { current: false };

/**
 * Initial template ID — always a valid string.
 * Priority: persisted localStorage > defaultResume > DEFAULT_TEMPLATE_ID
 */
const initialTemplateId: string = (() => {
  const persisted = getPersistedTemplateId();
  const fromDefault = defaultResume?.template?.templateId;
  return ensureValidTemplateId(persisted ?? fromDefault ?? null);
})();

const isDev = process.env.NODE_ENV === 'development';

function devLog(...args: unknown[]) {
  if (isDev) console.debug('[editorStore]', ...args);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  resumeData: normalizeBlockLayout(defaultResume as Resume),
  latexSource: '',
  editorMode: 'blocks',
  isDirty: false,
  dirtyReason: null,
  compileStatus: 'idle',
  compileErrors: [],
  lastGeneratedLatexHash: null,
  lastCompiledLatexHash: null,
  lastCompiledAt: null,
  pdfUrl: null,
  pdfVersion: 0,
  selectedBlockId: null,
  activeSection: 'personal',
  aiDrawerOpen: false,
  rawLatexMode: false,
  showLatexPanel: false,
  aiContext: null,
  compileId: null,
  synctexAvailable: false,
  autoCompileAfterAi: false,
  currentTemplateId: initialTemplateId,
  lastPdfUrl: getLastPdfUrl(),
  autoCompileEnabled: false,
  isAutoCompileWaiting: false,
  activeLeftTab: 'navigate',

  setResumeData: (resume) => set({ resumeData: resume }),

  updateResumeData: (updater) => {
    const next = updater(get().resumeData);
    set({ resumeData: next, isDirty: true, dirtyReason: 'blocks edited' });
    devLog('markDirty: blocks edited', 'fullName=', next.personal?.fullName);
  },

  setLatexSource: (source) => set({ latexSource: source }),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  setActiveSection: (section) => set({ activeSection: section }),
  setCompileStatus: (status) => set({ compileStatus: status }),
  setCompileErrors: (errors) => set({ compileErrors: errors }),

  toggleAiDrawer: () => set((state) => ({ aiDrawerOpen: !state.aiDrawerOpen })),
  toggleRawLatexMode: () => set((state) => ({ rawLatexMode: !state.rawLatexMode })),

  setAutoCompileAfterAi: (enabled) => set({ autoCompileAfterAi: enabled }),

  setCurrentTemplateId: (id) => {
    const validId = ensureValidTemplateId(id);
    const latex = renderWithTemplate(get().resumeData, validId);
    const hash = checksumLatex(latex);
    setPersistedTemplateId(validId);
    set({
      currentTemplateId: validId,
      latexSource: latex,
      lastGeneratedLatexHash: hash,
      compileStatus: 'idle',
      compileErrors: [],
    });
  },

  bootstrap: () => {
    if (bootstrapDone) return;
    bootstrapDone = true;
    const latex = renderWithTemplate(get().resumeData, get().currentTemplateId);
    const hash = checksumLatex(latex);
    devLog('bootstrap: resumeData.fullName=', get().resumeData.personal?.fullName);
    devLog('bootstrap: latexHash=', hash);
    set({ latexSource: latex, lastGeneratedLatexHash: hash });
  },

  jumpToLine: (line: number) => {
    set({ selectedBlockId: `error-line-${line}` });
  },

  navigateToBlock: (blockId: string) => {
    set({ selectedBlockId: blockId });
  },

  generateFromBlocks: () => {
    const { resumeData, currentTemplateId } = get();
    const latex = renderWithTemplate(resumeData, currentTemplateId);
    const hash = checksumLatex(latex);
    devLog('generateFromBlocks: latexHash=', hash, 'fullName=', resumeData.personal?.fullName);
    set({ latexSource: latex, lastGeneratedLatexHash: hash, compileStatus: 'idle', compileErrors: [] });
  },

  regenerateLatexFromBlocks: () => {
    const { resumeData, currentTemplateId } = get();
    const latex = renderWithTemplate(resumeData, currentTemplateId);
    const hash = checksumLatex(latex);
    devLog('regenerateLatexFromBlocks: latexHash=', hash, 'fullName=', resumeData.personal?.fullName);
    set({
      latexSource: latex,
      lastGeneratedLatexHash: hash,
      isDirty: false,
      dirtyReason: null,
      compileStatus: 'idle',
      compileErrors: [],
    });
  },

  resetToTemplate: () => {
    const { resumeData, currentTemplateId } = get();
    const latex = renderWithTemplate(resumeData, currentTemplateId);
    const hash = checksumLatex(latex);
    set({ latexSource: latex, lastGeneratedLatexHash: hash, compileStatus: 'idle', compileErrors: [] });
  },

  compile: async () => {
    const { editorMode, resumeData, currentTemplateId } = get();

    // In blocks mode: regenerate LaTeX from resumeData first
    if (editorMode === 'blocks') {
      devLog('compile: blocks mode — regenerating LaTeX first', 'fullName=', resumeData.personal?.fullName);
      const latex = renderWithTemplate(resumeData, currentTemplateId);
      const hash = checksumLatex(latex);
      devLog('compile: blocks mode latexHash=', hash);
      set({
        latexSource: latex,
        lastGeneratedLatexHash: hash,
        isDirty: false,
        dirtyReason: null,
      });
    } else {
      devLog('compile: latex mode — using latexSource directly', 'latexHash=', get().lastGeneratedLatexHash);
    }

    await get().compileCurrent();
  },

  compileCurrent: async () => {
    const { latexSource } = get();
    const hashBefore = checksumLatex(latexSource);
    devLog('compileCurrent: latexHash before compile=', hashBefore);

    set({ compileStatus: 'compiling', compileErrors: [] });

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexSource }),
      });
      const result = await response.json();

      if (result.ok) {
        const newVersion = get().pdfVersion + 1;
        const pdfUrlWithVersion = `${result.pdfUrl}?v=${newVersion}`;
        devLog('compileCurrent: pdfUrl after compile=', pdfUrlWithVersion);

        setLastCompiledHash(hashBefore);
        setLastPdfUrl(result.pdfUrl);

        set({
          compileStatus: 'success',
          pdfUrl: pdfUrlWithVersion,
          pdfVersion: newVersion,
          lastPdfUrl: result.pdfUrl,
          lastCompiledLatexHash: hashBefore,
          lastCompiledAt: Date.now(),
          compileId: result.compileId || null,
          synctexAvailable: result.synctexAvailable || false,
        });
      } else {
        set({
          compileStatus: 'error',
          compileErrors: result.errors || [{ line: 1, message: 'Compilation failed', severity: 'error' }],
        });
      }
    } catch {
      set({
        compileStatus: 'error',
        compileErrors: [{ line: 1, message: 'Network error during compilation', severity: 'error' }],
      });
    }
  },

  exportPdf: async () => {
    const { compile, pdfUrl } = get();
    if (!pdfUrl) {
      await compile();
    }
  },

  askAiToFix: (error: CompileError) => {
    const context = error.raw
      ? `Fix this LaTeX error:\nError: ${error.message}\nLine: ${error.line || 'unknown'}\n\nLaTeX log:\n${error.raw}`
      : `Fix this LaTeX error:\nError: ${error.message}\nLine: ${error.line || 'unknown'}`;
    set({ aiContext: context, aiDrawerOpen: true });
  },

  clearAiContext: () => set({ aiContext: null }),

  setEditorMode: (mode) => set({ editorMode: mode }),

  markDirty: (reason) => {
    devLog('markDirty:', reason);
    set({ isDirty: true, dirtyReason: reason });
  },

  setShowLatexPanel: (show) => set({ showLatexPanel: show }),

  toggleShowLatexPanel: () => set((state) => ({ showLatexPanel: !state.showLatexPanel })),

  setAutoCompileEnabled: (enabled) => set({ autoCompileEnabled: enabled }),

  toggleAutoCompile: () => set((state) => ({ autoCompileEnabled: !state.autoCompileEnabled })),

  setIsAutoCompileWaiting: (waiting) => set({ isAutoCompileWaiting: waiting }),

  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
}));
