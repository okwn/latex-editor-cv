'use client';

import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { createSnapshot } from '@/lib/resume/persistence';
import { useToast } from '@/components/ui/Toast';

interface UseKeyboardShortcutsProps {
  onTogglePreview?: () => void;
  onToggleLatex?: () => void;
  onToggleBlocks?: () => void;
}

export function useKeyboardShortcuts({
  onTogglePreview,
  onToggleLatex,
  onToggleBlocks,
}: UseKeyboardShortcutsProps = {}) {
  const toast = useToast();
  const {
    compile,
    latexSource,
    currentTemplateId,
    resumeData,
    toggleAiDrawer,
    setActiveSection,
    activeSection,
  } = useEditorStore();

  const handleCreateSnapshot = useCallback(() => {
    if (!latexSource) return;
    createSnapshot(resumeData, latexSource, currentTemplateId);
    toast({ message: 'Snapshot saved', type: 'success' });
  }, [resumeData, latexSource, currentTemplateId, toast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key) {
        case 's':
        case 'S':
          e.preventDefault();
          handleCreateSnapshot();
          break;
        case 'Enter':
          e.preventDefault();
          compile();
          break;
        case 'b':
        case 'B':
          if (e.shiftKey && onToggleBlocks) {
            e.preventDefault();
            onToggleBlocks();
          } else {
            e.preventDefault();
            setActiveSection(activeSection === 'personal' ? 'summary' : 'personal');
          }
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          toggleAiDrawer();
          break;
        case 'p':
        case 'P':
          if (e.shiftKey && onTogglePreview) {
            e.preventDefault();
            onTogglePreview();
          }
          break;
        case 'l':
        case 'L':
          if (e.shiftKey && onToggleLatex) {
            e.preventDefault();
            onToggleLatex();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCreateSnapshot, compile, toggleAiDrawer, setActiveSection, activeSection, onTogglePreview, onToggleLatex, onToggleBlocks]);
}
