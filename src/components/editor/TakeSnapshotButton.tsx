'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { createSnapshot } from '@/lib/resume/snapshotStore';
import { useToast } from '@/components/ui/Toast';
import { Camera } from 'lucide-react';

interface TakeSnapshotButtonProps {
  cvId: string;
}

export function TakeSnapshotButton({ cvId }: TakeSnapshotButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const toast = useToast();

  const { resumeData, latexSource, currentTemplateId, editorMode } = useEditorStore();

  const openModal = useCallback(() => {
    const now = new Date();
    const defaultLabel = `Snapshot - ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLabel(defaultLabel);
    setNote('');
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!label.trim()) return;
    createSnapshot({
      cvId,
      label: label.trim(),
      resumeData,
      latexSource,
      templateId: currentTemplateId,
      editorMode,
      note: note.trim() || undefined,
    });
    setShowModal(false);
    toast({ message: 'Snapshot saved', type: 'success' });
  }, [cvId, label, note, resumeData, latexSource, currentTemplateId, editorMode, toast]);

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors text-xs"
        title="Take snapshot"
      >
        <Camera size={11} />
        <span className="hidden sm:inline">Take Snapshot</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-base font-semibold text-zinc-100 mb-1">Take Snapshot</h2>
            <p className="text-xs text-zinc-500 mb-5">Save the current state of your CV. You can restore it later.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Label</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Note <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
                  placeholder="What changed, why, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!label.trim()}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}