import { v4 as uuid } from 'uuid';
import type { CvDocument } from '@/types/cv';
import { Resume } from '@/types/resume';
import { defaultResume } from '@/lib/resume/defaultResume';
import { renderWithTemplate } from '@/lib/resume/editorStore';
import { checksumLatex } from '@/lib/resume/persistence';

const STORAGE_KEY = 'kcv-documents';

/** Sentinel value for when localStorage is unavailable (SSR). */
function safeGetItem(_key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(_key);
  } catch {
    return null;
  }
}

function safeSetItem(_key: string, _value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(_key, _value);
  } catch {
    // storage quota exceeded or private mode
  }
}

function safeRemoveItem(_key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(_key);
  } catch {
    // ignore
  }
}

function loadAll(): CvDocument[] {
  const raw = safeGetItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CvDocument[];
  } catch {
    return [];
  }
}

function saveAll(docs: CvDocument[]): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(docs));
}

function makeDefault(title: string, templateId: string): CvDocument {
  const now = new Date().toISOString();
  const resumeData: Resume = JSON.parse(JSON.stringify(defaultResume));
  resumeData.template = {
    templateId,
    templateName: 'KCV Modern LaTeX',
  };
  const latexSource = renderWithTemplate(resumeData, templateId);

  return {
    id: uuid(),
    title,
    templateId,
    resumeData,
    latexSource,
    createdAt: now,
    updatedAt: now,
  };
}

export function listCvDocuments(): CvDocument[] {
  return loadAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function createCvDocument(
  templateId: string,
  title?: string
): CvDocument {
  const docs = loadAll();
  const doc = makeDefault(title ?? 'My CV', templateId);
  docs.unshift(doc);
  saveAll(docs);
  return doc;
}

export function getCvDocument(id: string): CvDocument | null {
  const docs = loadAll();
  return docs.find((d) => d.id === id) ?? null;
}

export function updateCvDocument(
  id: string,
  patch: Partial<Omit<CvDocument, 'id' | 'createdAt'>>
): CvDocument | null {
  const docs = loadAll();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  const updated: CvDocument = {
    ...docs[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  docs[idx] = updated;
  saveAll(docs);
  return updated;
}

export function deleteCvDocument(id: string): boolean {
  const docs = loadAll();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  docs.splice(idx, 1);
  saveAll(docs);
  return true;
}

export function duplicateCvDocument(id: string): CvDocument | null {
  const docs = loadAll();
  const original = docs.find((d) => d.id === id);
  if (!original) return null;

  const now = new Date().toISOString();
  const copy: CvDocument = {
    ...JSON.parse(JSON.stringify(original)),
    id: uuid(),
    title: `${original.title} (copy)`,
    createdAt: now,
    updatedAt: now,
    lastCompiledAt: undefined,
    lastPdfUrl: undefined,
  };

  docs.unshift(copy);
  saveAll(docs);
  return copy;
}

/** Persist compile result back into the document record. */
export function touchCvDocumentCompile(
  id: string,
  pdfUrl: string
): CvDocument | null {
  return updateCvDocument(id, {
    lastCompiledAt: new Date().toISOString(),
    lastPdfUrl: pdfUrl,
  });
}

/**
 * Returns all template cards available for selection in the dashboard.
 */
export function getTemplateCards() {
  return [
    {
      id: 'kcv-modern',
      name: 'KCV Modern LaTeX',
      description: 'Clean, professional two-column layout with project cards and horizontal section rules.',
    },
    {
      id: 'classic',
      name: 'Classic LaTeX',
      description: 'Traditional single-column CV suitable for academic or formal use.',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Stripped-down design focused on content and readability.',
    },
  ];
}