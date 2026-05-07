'use client';

import { useState, useCallback, useEffect } from 'react';
import { listSnapshots, deleteSnapshot, formatSnapshotDate, type Snapshot } from '@/lib/resume/snapshotStore';
import { useEditorStore } from '@/lib/resume/editorStore';
import { useRouter } from 'next/navigation';
import { createCvDocument, updateCvDocument } from '@/lib/resume/documentStore';
import { useToast } from '@/components/ui/Toast';
import { Clock, RotateCcw, Copy, Trash2, AlertTriangle } from 'lucide-react';

const MAX_SNAPSHOTS = 30;

interface SnapshotPanelProps {
  cvId: string;
  onClose?: () => void;
}

export function SnapshotPanel({ cvId, onClose }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const toast = useToast();

  const {
    setResumeData,
    setLatexSource,
    setCurrentTemplateId,
    setEditorMode,
    markDirty,
  } = useEditorStore();

  const router = useRouter();

  const load = useCallback(() => {
    setSnapshots(listSnapshots(cvId));
  }, [cvId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = useCallback((snap: Snapshot) => {
    setResumeData(snap.resumeData);
    setLatexSource(snap.latexSource);
    setCurrentTemplateId(snap.templateId);
    setEditorMode(snap.editorMode);
    markDirty('Snapshot restored');
    setConfirmRestore(null);
    toast({ message: 'Snapshot restored — compile to update PDF', type: 'success' });
  }, [setResumeData, setLatexSource, setCurrentTemplateId, setEditorMode, markDirty, toast]);

  const handleDuplicate = useCallback((snap: Snapshot) => {
    const doc = createCvDocument(snap.templateId, `${snap.label} (from snapshot)`);
    updateCvDocument(doc.id, {
      resumeData: snap.resumeData,
      latexSource: snap.latexSource,
    });
    toast({ message: 'New CV created from snapshot', type: 'success' });
    router.push(`/editor/${doc.id}`);
    onClose?.();
  }, [router, onClose, toast]);

  const handleDelete = useCallback((id: string) => {
    deleteSnapshot(id);
    load();
    toast({ message: 'Snapshot deleted', type: 'success' });
  }, [load, toast]);

  const showMaxWarning = snapshots.length >= MAX_SNAPSHOTS;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-zinc-500" />
          <span className="text-xs font-medium text-zinc-300">Snapshots</span>
          <span className="text-xs text-zinc-600">({snapshots.length})</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Max warning */}
      {showMaxWarning && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-amber-900/20 border border-amber-800/30 rounded-md">
          <AlertTriangle size={12} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">Consider deleting old snapshots — {MAX_SNAPSHOTS} max.</p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {snapshots.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-8">No snapshots yet.</p>
        ) : (
          snapshots.map((snap) => (
            <div key={snap.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-md p-3 hover:border-zinc-600/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-medium text-zinc-200 truncate">{snap.label}</p>
                <span className="text-xs text-zinc-500 shrink-0">{snap.editorMode}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-1">{formatSnapshotDate(snap.createdAt)}</p>
              {snap.note && (
                <p className="text-xs text-zinc-400 mb-2 italic">&ldquo;{snap.note}&rdquo;</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {confirmRestore === snap.id ? (
                  <>
                    <span className="text-xs text-zinc-400">Restore?</span>
                    <button
                      onClick={() => handleRestore(snap)}
                      className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmRestore(null)}
                      className="px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition-colors"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmRestore(snap.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-zinc-100 transition-colors"
                    >
                      <RotateCcw size={10} /> Restore
                    </button>
                    <button
                      onClick={() => handleDuplicate(snap)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                    >
                      <Copy size={10} /> New CV
                    </button>
                    <button
                      onClick={() => handleDelete(snap.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors ml-auto"
                    >
                      <Trash2 size={10} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}