import { v4 as uuid } from 'uuid';
import type { Resume } from '@/types/resume';

export interface Snapshot {
  id: string;
  cvId: string;
  label: string;
  createdAt: string;
  resumeData: Resume;
  latexSource: string;
  templateId: string;
  editorMode: 'blocks' | 'latex';
  note?: string;
}

const STORAGE_KEY = 'kcv-snapshots';

function safeGetItem(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeSetItem(value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // storage quota exceeded
  }
}

function loadAll(): Snapshot[] {
  const raw = safeGetItem();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Snapshot[]) : [];
  } catch {
    return [];
  }
}

function saveAll(snapshots: Snapshot[]): void {
  safeSetItem(JSON.stringify(snapshots));
}

export function listSnapshots(cvId: string): Snapshot[] {
  return loadAll()
    .filter((s) => s.cvId === cvId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createSnapshot(data: {
  cvId: string;
  label: string;
  resumeData: Resume;
  latexSource: string;
  templateId: string;
  editorMode: 'blocks' | 'latex';
  note?: string;
}): Snapshot {
  const snapshots = loadAll();
  const snap: Snapshot = {
    id: uuid(),
    cvId: data.cvId,
    label: data.label,
    createdAt: new Date().toISOString(),
    resumeData: data.resumeData,
    latexSource: data.latexSource,
    templateId: data.templateId,
    editorMode: data.editorMode,
    note: data.note,
  };
  snapshots.unshift(snap);
  saveAll(snapshots);
  return snap;
}

export function deleteSnapshot(id: string): boolean {
  const snapshots = loadAll();
  const idx = snapshots.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  snapshots.splice(idx, 1);
  saveAll(snapshots);
  return true;
}

export function getSnapshotCount(cvId: string): number {
  return loadAll().filter((s) => s.cvId === cvId).length;
}

export function clearSnapshotsForCv(cvId: string): void {
  const snapshots = loadAll().filter((s) => s.cvId !== cvId);
  saveAll(snapshots);
}

export function formatSnapshotDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}