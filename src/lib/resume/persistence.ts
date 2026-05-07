import type { Resume } from '@/types/resume';
import { v4 as uuid } from 'uuid';

const LS_RESUME = 'kcv-resume-data';
const LS_LATEX = 'kcv-latex-source';
const LS_SNAPSHOTS = 'kcv-snapshots';
const LS_TEMPLATE_ID = 'kcv-template-id';
const LS_AUTOSAVE_ENABLED = 'kcv-autosave';
const LS_AUTOSAVE_DEBOUNCE = 'kcv-autosave-debounce';

/**
 * Snapshot — a point-in-time capture of the resume editor state.
 */
export interface Snapshot {
  id: string;
  label: string;
  createdAt: number; // Unix timestamp ms
  resumeData: Resume;
  latexSource: string;
  templateId: string;
}

/**
 * Persisted editor state — only what's stored in localStorage.
 */
// --- Resume data ---

export function saveResumeData(data: Resume): void {
  try {
    localStorage.setItem(LS_RESUME, JSON.stringify(data));
  } catch (e) {
    console.error('[kcv] Failed to save resume data:', e);
  }
}

export function loadResumeData(): Resume | null {
  try {
    const raw = localStorage.getItem(LS_RESUME);
    if (!raw) return null;
    return JSON.parse(raw) as Resume;
  } catch {
    return null;
  }
}

export function clearResumeData(): void {
  localStorage.removeItem(LS_RESUME);
}

// --- LaTeX source ---

export function saveLatexSource(source: string): void {
  try {
    localStorage.setItem(LS_LATEX, source);
  } catch (e) {
    console.error('[kcv] Failed to save LaTeX source:', e);
  }
}

export function loadLatexSource(): string | null {
  try {
    return localStorage.getItem(LS_LATEX);
  } catch {
    return null;
  }
}

export function clearLatexSource(): void {
  localStorage.removeItem(LS_LATEX);
}

// --- Template ID ---

export function saveTemplateId(id: string): void {
  try {
    localStorage.setItem(LS_TEMPLATE_ID, id);
  } catch (e) {
    console.error('[kcv] Failed to save template ID:', e);
  }
}

export function loadTemplateId(): string | null {
  try {
    return localStorage.getItem(LS_TEMPLATE_ID);
  } catch {
    return null;
  }
}

export function getPersistedTemplateId(): string | null {
  return loadTemplateId();
}

export function setPersistedTemplateId(id: string): void {
  saveTemplateId(id);
}

// --- Export / Import Resume JSON ---

export function exportResumeJson(data: Resume): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kcv-resume-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importResumeJson(file: File): Promise<Resume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        resolve(parsed as Resume);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// --- Compile hash (detect stale PDF) ---

const LS_LAST_COMPILED_HASH = 'kcv-last-compile-hash';
const LS_LAST_PDF_URL = 'kcv-last-pdf-url';

export function getLastCompiledHash(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(LS_LAST_COMPILED_HASH);
}

export function setLastCompiledHash(hash: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_LAST_COMPILED_HASH, hash);
}

export function getLastPdfUrl(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(LS_LAST_PDF_URL);
}

export function setLastPdfUrl(url: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_LAST_PDF_URL, url);
}

export function checksumLatex(source: string): string {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function isPdfStale(latexSource: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  const last = getLastCompiledHash();
  if (!last) return true;
  return checksumLatex(latexSource) !== last;
}

// --- Export LaTeX source as .tex ---

export function exportLatexSource(latexSource: string): void {
  const blob = new Blob([latexSource], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'main.tex';
  a.click();
  URL.revokeObjectURL(url);
}

// --- Build ZIP with all export files ---

export async function buildZip(
  pdfUrl: string,
  latexSource: string,
  resumeData: Resume
): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  // README.txt
  zip.file(
    'README.txt',
    `Kartal CV Maker Export
=====================

Files included:
- resume.pdf   : Compiled PDF resume
- main.tex     : LaTeX source file
- resume.json  : Raw resume data (JSON)

This export was generated by Kartal CV Maker.
For best results, compile main.tex with a LaTeX tool like
tectonic, latexmk, xelatex, or pdflatex.

Date: ${new Date().toLocaleString()}
`
  );

  // main.tex
  zip.file('main.tex', latexSource);

  // resume.json
  zip.file('resume.json', JSON.stringify(resumeData, null, 2));

  // resume.pdf — fetch from URL
  if (pdfUrl) {
    try {
      const response = await fetch(pdfUrl);
      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        zip.file('resume.pdf', pdfBuffer);
      }
    } catch {
      // PDF not available — skip
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function exportZip(
  pdfUrl: string,
  latexSource: string,
  resumeData: Resume
): Promise<void> {
  const blob = await buildZip(pdfUrl, latexSource, resumeData);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kcv-export-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Autosave settings ---

export function getAutosaveEnabled(): boolean {
  return localStorage.getItem(LS_AUTOSAVE_ENABLED) !== 'false'; // default true
}

export function setAutosaveEnabled(enabled: boolean): void {
  localStorage.setItem(LS_AUTOSAVE_ENABLED, String(enabled));
}

export function getAutosaveDebounceMs(): number {
  const stored = localStorage.getItem(LS_AUTOSAVE_DEBOUNCE);
  if (stored) {
    const n = Number(stored);
    if (!isNaN(n) && n >= 500) return n;
  }
  return 2000; // default 2s
}

export function setAutosaveDebounceMs(ms: number): void {
  localStorage.setItem(LS_AUTOSAVE_DEBOUNCE, String(ms));
}

// --- Snapshots ---

export function getSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(LS_SNAPSHOTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Snapshot[];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: Snapshot[]): void {
  try {
    localStorage.setItem(LS_SNAPSHOTS, JSON.stringify(snapshots));
  } catch (e) {
    console.error('[kcv] Failed to save snapshots:', e);
  }
}

export function createSnapshot(
  resumeData: Resume,
  latexSource: string,
  templateId: string,
  label?: string
): Snapshot {
  const snapshot: Snapshot = {
    id: uuid(),
    label: label || `Snapshot ${new Date().toLocaleString()}`,
    createdAt: Date.now(),
    resumeData,
    latexSource,
    templateId,
  };
  const existing = getSnapshots();
  saveSnapshots([snapshot, ...existing]);
  return snapshot;
}

export function deleteSnapshot(id: string): void {
  const existing = getSnapshots();
  saveSnapshots(existing.filter((s) => s.id !== id));
}

export function restoreSnapshot(
  id: string
): { resumeData: Resume; latexSource: string; templateId: string } | null {
  const existing = getSnapshots();
  const snap = existing.find((s) => s.id === id);
  if (!snap) return null;
  return {
    resumeData: snap.resumeData,
    latexSource: snap.latexSource,
    templateId: snap.templateId,
  };
}

// --- Bulk clear ---

export function clearAllPersistence(): void {
  localStorage.removeItem(LS_RESUME);
  localStorage.removeItem(LS_LATEX);
  localStorage.removeItem(LS_TEMPLATE_ID);
  localStorage.removeItem(LS_SNAPSHOTS);
  localStorage.removeItem(LS_AUTOSAVE_ENABLED);
  localStorage.removeItem(LS_AUTOSAVE_DEBOUNCE);
}

// --- Dirty flag (unsaved changes) ---

/** Key used to track the last-known-persisted resume checksum */
const LS_DIRTY_FLAG = 'kcv-dirty';

export function isDirty(currentResumeData: Resume): boolean {
  try {
    const stored = localStorage.getItem(LS_DIRTY_FLAG);
    if (!stored) return false;
    const { checksum } = JSON.parse(stored);
    const current = checksumResume(currentResumeData);
    return current !== checksum;
  } catch {
    return false;
  }
}

export function markClean(currentResumeData: Resume): void {
  const checksum = checksumResume(currentResumeData);
  localStorage.setItem(LS_DIRTY_FLAG, JSON.stringify({ checksum }));
}

function checksumResume(data: Resume): string {
  // Simple structural checksum — just hash the JSON string
  let hash = 0;
  const str = JSON.stringify(data);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
