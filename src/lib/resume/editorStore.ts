import { create } from 'zustand';
import { Resume } from '@/types/resume';
import { defaultResume } from '@/lib/resume/defaultResume';
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
  // Compile state
  compileStatus: CompileStatus;
  compileErrors: CompileError[];
  // Selection
  selectedBlockId: string | null;
  activeSection: ActiveSection;
  // UI
  aiDrawerOpen: boolean;
  pdfUrl: string | null;
  rawLatexMode: boolean;
  aiContext: string | null;
  compileId: string | null;
  synctexAvailable: boolean;
  autoCompileAfterAi: boolean;
  currentTemplateId: string;
  lastPdfUrl: string | null;
  // Actions
  setResumeData: (resume: Resume) => void;
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
  resetToTemplate: () => void;
  compile: () => Promise<void>;
  exportPdf: () => Promise<void>;
  jumpToLine: (line: number) => void;
  askAiToFix: (error: CompileError) => void;
  clearAiContext: () => void;
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

/**
 * Initial template ID — always a valid string.
 * Priority: persisted localStorage > defaultResume > DEFAULT_TEMPLATE_ID
 */
const initialTemplateId: string = (() => {
  const persisted = getPersistedTemplateId();
  const fromDefault = defaultResume?.template?.templateId;
  return ensureValidTemplateId(persisted ?? fromDefault ?? null);
})();

export const useEditorStore = create<EditorState>((set, get) => ({
  resumeData: defaultResume,
  latexSource: '',
  compileStatus: 'idle',
  compileErrors: [],
  selectedBlockId: null,
  activeSection: 'personal',
  aiDrawerOpen: false,
  pdfUrl: null,
  rawLatexMode: false,
  aiContext: null,
  compileId: null,
  synctexAvailable: false,
  autoCompileAfterAi: false,
  currentTemplateId: initialTemplateId,
  lastPdfUrl: getLastPdfUrl(),

  setResumeData: (resume) => set({ resumeData: resume }),
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
    setPersistedTemplateId(validId);
    set({ currentTemplateId: validId, latexSource: latex, compileStatus: 'idle', compileErrors: [] });
  },
  bootstrap: () => {
    if (bootstrapDone) return;
    bootstrapDone = true;
    const latex = renderWithTemplate(get().resumeData, get().currentTemplateId);
    set({ latexSource: latex });
  },

  jumpToLine: (line: number) => {
    set({ selectedBlockId: `error-line-${line}` });
  },

  generateFromBlocks: () => {
    const { resumeData, currentTemplateId } = get();
    const latex = renderWithTemplate(resumeData, currentTemplateId);
    set({ latexSource: latex, compileStatus: 'idle', compileErrors: [] });
  },

  resetToTemplate: () => {
    const { resumeData, currentTemplateId } = get();
    const latex = renderWithTemplate(resumeData, currentTemplateId);
    set({ latexSource: latex, compileStatus: 'idle', compileErrors: [] });
  },

  compile: async () => {
    set({ compileStatus: 'compiling', compileErrors: [] });
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexSource: get().latexSource }),
      });
      const result = await response.json();
      if (result.ok) {
        const hash = checksumLatex(get().latexSource);
        setLastCompiledHash(hash);
        setLastPdfUrl(result.pdfUrl);
        set({
          compileStatus: 'success',
          pdfUrl: result.pdfUrl,
          lastPdfUrl: result.pdfUrl,
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
}));