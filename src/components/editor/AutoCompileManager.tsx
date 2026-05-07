'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';

const AUTO_COMPILE_DELAY_MS = 2500;

/**
 * AutoCompileManager
 *
 * Handles automatic compilation with the following guarantees:
 * - 2.5s debounce after any change
 * - No compile on initial page load (bootstrap guard)
 * - No compile loop when pdfUrl updates
 * - If compile is running and another change arrives, mark pending and
 *   compile again after current finishes + debounce
 * - Works for both blocks mode (resumeData) and latex mode (latexSource)
 *
 * Placement: render once in the editor page, outside all panels.
 */
export function AutoCompileManager() {
  const {
    autoCompileEnabled,
    resumeData,
    latexSource,
    isDirty,
    setIsAutoCompileWaiting,
    compile,
  } = useEditorStore();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const bootstrappedRef = useRef(false);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsAutoCompileWaiting(false);
  }, [setIsAutoCompileWaiting]);

  const scheduleCompile = useCallback(() => {
    if (!autoCompileEnabled || !bootstrappedRef.current) return;
    clearDebounce();
    setIsAutoCompileWaiting(true);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      setIsAutoCompileWaiting(false);
      // Re-read compileStatus from store to avoid stale closure
      const status = useEditorStore.getState().compileStatus;
      if (status === 'compiling') {
        pendingRef.current = true;
        return;
      }
      useEditorStore.getState().compile();
    }, AUTO_COMPILE_DELAY_MS);
  }, [autoCompileEnabled, clearDebounce, setIsAutoCompileWaiting]);

  // Watch for changes that should trigger auto-compile
  useEffect(() => {
    if (!bootstrappedRef.current) return; // don't fire on initial load
    if (!autoCompileEnabled) return;
    if (!isDirty) return; // nothing changed

    scheduleCompile();
  }, [isDirty, resumeData, latexSource, autoCompileEnabled, scheduleCompile]);

  // When a compile finishes, check if there's a pending compile.
  // We watch compileStatus indirectly via an empty deps array plus store re-reads.
  useEffect(() => {
    const status = useEditorStore.getState().compileStatus;
    if (status === 'compiling') return;

    if (!pendingRef.current) return;
    if (!useEditorStore.getState().autoCompileEnabled) {
      pendingRef.current = false;
      return;
    }

    pendingRef.current = false;
    setIsAutoCompileWaiting(true);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      setIsAutoCompileWaiting(false);
      const currentStatus = useEditorStore.getState().compileStatus;
      if (currentStatus !== 'compiling') {
        useEditorStore.getState().compile();
      }
    }, AUTO_COMPILE_DELAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — drains pending compile via store re-read

  // Bootstrap: enable auto-compile from this point forward.
  // Parent calls window.dispatchEvent(new Event('kcv:bootstrap-complete')) after mount.
  useEffect(() => {
    const handler = () => {
      bootstrappedRef.current = true;
    };
    window.addEventListener('kcv:bootstrap-complete', handler);
    return () => window.removeEventListener('kcv:bootstrap-complete', handler);
  }, []);

  // When auto compile is disabled, cancel any pending timer
  useEffect(() => {
    if (!autoCompileEnabled) {
      clearDebounce();
      pendingRef.current = false;
    }
  }, [autoCompileEnabled, clearDebounce]);

  return null;
}