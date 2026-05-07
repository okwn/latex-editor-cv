'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import {
  getSnapshots,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  type Snapshot,
  importResumeJson,
  exportResumeJson,
  getAutosaveEnabled,
  setAutosaveEnabled,
  getAutosaveDebounceMs,
  setAutosaveDebounceMs,
  isDirty,
  markClean,
} from '@/lib/resume/persistence';

interface SnapshotManagerProps {
  onRestore?: () => void;
}

export function SnapshotManager({ onRestore }: SnapshotManagerProps) {
  const {
    resumeData,
    latexSource,
    currentTemplateId,
    setResumeData,
    setLatexSource,
    setCurrentTemplateId,
  } = useEditorStore();

  // Lazy init from localStorage (synchronous — no effect, no setState in render)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => getSnapshots());
  const [autosaveEnabled, setAutosaveEnabledState] = useState<boolean>(() => getAutosaveEnabled());
  const [debounceMs, setDebounceMsState] = useState<number>(() => getAutosaveDebounceMs());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset] = useState(false);
  const [dirty, setDirty] = useState<boolean>(() => isDirty(resumeData));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeDataRef = useRef(resumeData);

  // Defer ref and dirty flag updates to avoid setState-in-effect ESLint error
  useEffect(() => {
    resumeDataRef.current = resumeData;
    const timer = setTimeout(() => {
      setDirty(isDirty(resumeDataRef.current));
    }, 0);
    return () => clearTimeout(timer);
  }, [resumeData]);

  const refreshSnapshots = useCallback(() => {
    setSnapshots(getSnapshots());
  }, []);

  const handleCreateSnapshot = useCallback(() => {
    createSnapshot(resumeData, latexSource, currentTemplateId);
    refreshSnapshots();
  }, [resumeData, latexSource, currentTemplateId, refreshSnapshots]);

  const handleRestoreSnapshot = useCallback((id: string) => {
    const result = restoreSnapshot(id);
    if (!result) return;
    setResumeData(result.resumeData);
    setLatexSource(result.latexSource);
    setCurrentTemplateId(result.templateId);
    markClean(result.resumeData);
    setDirty(false);
    onRestore?.();
    refreshSnapshots();
  }, [setResumeData, setLatexSource, setCurrentTemplateId, onRestore, refreshSnapshots]);

  const handleDeleteSnapshot = useCallback((id: string) => {
    deleteSnapshot(id);
    refreshSnapshots();
  }, [refreshSnapshots]);

  const handleExport = useCallback(() => {
    exportResumeJson(resumeData);
  }, [resumeData]);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      setImportError(null);
      const data = await importResumeJson(file);
      setResumeData(data);
      setLatexSource('');
      markClean(data);
      setDirty(false);
      setShowImportModal(false);
    } catch (err) {
      setImportError((err as Error).message);
    }
  }, [setResumeData, setLatexSource]);

  const handleToggleAutosave = useCallback((enabled: boolean) => {
    setAutosaveEnabled(enabled);
    setAutosaveEnabledState(enabled);
  }, []);

  const handleDebounceChange = useCallback((ms: number) => {
    setAutosaveDebounceMs(ms);
    setDebounceMsState(ms);
  }, []);

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Autosave settings */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Autosave</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autosaveEnabled}
              onChange={(e) => handleToggleAutosave(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/30"
            />
            <span className="text-zinc-400 text-xs">Enable autosave</span>
          </label>
          {autosaveEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs">Debounce:</span>
              {[500, 1000, 2000, 5000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => handleDebounceChange(ms)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    debounceMs === ms
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dirty indicator */}
      {dirty && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 text-xs">Unsaved changes</span>
        </div>
      )}

      {/* Snapshots */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Snapshots</h3>
          <button
            onClick={handleCreateSnapshot}
            className="px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium border border-amber-500/20"
          >
            + Create Snapshot
          </button>
        </div>

        {snapshots.length === 0 ? (
          <p className="text-zinc-600 text-xs italic">No snapshots yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-start justify-between gap-2 p-3 rounded-md bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200 text-xs font-medium truncate">{snap.label}</p>
                  <p className="text-zinc-500 text-xs">
                    {new Date(snap.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleRestoreSnapshot(snap.id)}
                    className="px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Export / Import */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Backup</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 px-3 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-xs border border-zinc-700"
          >
            Export JSON
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 px-3 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-xs border border-zinc-700"
          >
            Import JSON
          </button>
        </div>
      </section>

      {/* Import modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-80 max-w-[90vw]">
            <h3 className="text-zinc-200 font-semibold mb-4 text-sm">Import Resume JSON</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
              }}
              className="w-full text-zinc-400 text-xs file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-amber-500/10 file:text-amber-400 file:text-xs file:cursor-pointer"
            />
            {importError && (
              <p className="mt-2 text-red-400 text-xs">{importError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
