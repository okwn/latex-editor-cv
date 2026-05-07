'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';

const BLOCKS_DEBOUNCE_MS = 1200;
const LATEX_MODE_DEBOUNCE_MS = 2000;

export function AutoCompileManager() {
  const {
    autoCompileEnabled,
    editorMode,
    resumeData,
    latexSource,
    lastGeneratedLatexHash,
    lastCompiledLatexHash,
    compileStatus,
    compile,
  } = useEditorStore();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCompileRef = useRef(false);
  const lastTriggerHashRef = useRef<string | null>(null);

  const triggerCompile = useCallback(() => {
    if (compileStatus === 'compiling') {
      pendingCompileRef.current = true;
      return;
    }
    compile();
  }, [compile, compileStatus]);

  useEffect(() => {
    if (!autoCompileEnabled) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingCompileRef.current = false;
      return;
    }

    const debounceMs = editorMode === 'latex' ? LATEX_MODE_DEBOUNCE_MS : BLOCKS_DEBOUNCE_MS;

    let currentHash: string;
    if (editorMode === 'latex') {
      currentHash = latexSource;
    } else {
      // Use lastGeneratedLatexHash as proxy for resumeData content hash
      currentHash = lastGeneratedLatexHash ?? '';
    }

    // Don't re-trigger if hash hasn't changed
    if (currentHash === lastTriggerHashRef.current) return;
    lastTriggerHashRef.current = currentHash;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerCompile();
      lastTriggerHashRef.current = null;
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [autoCompileEnabled, editorMode, resumeData, latexSource, lastGeneratedLatexHash, triggerCompile]);

  // Handle pending compile after a compile finishes
  useEffect(() => {
    if (compileStatus === 'success' && pendingCompileRef.current) {
      pendingCompileRef.current = false;
      const timer = setTimeout(() => triggerCompile(), 100);
      return () => clearTimeout(timer);
    }
  }, [compileStatus, triggerCompile]);

  return null;
}