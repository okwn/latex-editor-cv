'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { validateAiResponse } from '@/lib/ai/schema';
import { useEditorStore } from '@/lib/resume/editorStore';
import { applyPatch } from '@/lib/resume/jsonPatch';
import { AiInput } from './AiInput';
import { AiPatchPreview } from './AiPatchPreview';
import { JobTailorPanel } from './JobTailorPanel';
import { CV_TAILOR_SYSTEM_PROMPT } from '@/lib/ai/prompts/cvTailorPrompt';
import type { Resume } from '@/types/resume';
import type { AiResponse } from '@/lib/ai/aiPatchSchema';

type DrawerTab = 'chat' | 'tailor';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  aiResponse?: AiResponse;
  error?: string;
}

const QUICK_ACTIONS = [
  { label: 'Improve summary', prompt: 'Improve my professional summary to be more impactful for a senior technical role' },
  { label: 'Match job description', prompt: 'Tailor my CV for the following job description: [paste job description]' },
  { label: 'Reorder skills', prompt: 'Reorder my skills to prioritize those most relevant to DevOps and cloud infrastructure' },
  { label: 'Reduce to one page', prompt: 'Suggest which projects and certifications to remove to fit on one page, keeping the most impactful ones' },
  { label: 'Corporate tone', prompt: 'Rewrite my summary and project descriptions in a more corporate, formal tone' },
  { label: 'Startup tone', prompt: 'Make my CV more startup-friendly: impact-driven, technical depth, tools-first' },
];

export function AiDrawer() {
  const { aiDrawerOpen, toggleAiDrawer, aiContext, resumeData, setResumeData, clearAiContext, autoCompileAfterAi, generateFromBlocks, compile, compileStatus } = useEditorStore();
  const [activeTab, setActiveTab] = useState<DrawerTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activePreviewMsgId, setActivePreviewMsgId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check provider status on mount
  useEffect(() => {
    fetch('/api/ai')
      .then((res) => res.json())
      .then((data) => setHasApiKey(data.available))
      .catch(() => setHasApiKey(false));
  }, []);

  // Prefill from aiContext
  const hasPrefilledRef = useRef(false);
  useEffect(() => {
    if (aiContext && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true;
      setMessages([
        {
          id: uuid(),
          role: 'user',
          content: aiContext,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [aiContext]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = { id: uuid(), role: 'user', content, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { id: uuid(), role: 'system', content: CV_TAILOR_SYSTEM_PROMPT },
            ...messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
            { id: uuid(), role: 'user', content },
          ],
          resumeJson: JSON.stringify(resumeData, null, 2),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.response) {
        throw new Error(data.error || 'AI request failed');
      }

      // Try to parse as JSON patch response with Zod validation
      const validation = validateAiResponse(data.response);

      if (validation.success && validation.data) {
        const assistantMsg: Message = {
          id: uuid(),
          role: 'assistant',
          content: validation.data.summary,
          timestamp: Date.now(),
          aiResponse: validation.data,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Non-JSON response — show as plain text
        const assistantMsg: Message = {
          id: uuid(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      const errorMsg = err as Error;
      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: 'assistant',
          content: `Error: ${errorMsg.message}`,
          timestamp: Date.now(),
          error: errorMsg.message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, resumeData]);

  const handleApplyPatches = useCallback((aiResponse: AiResponse) => {
    if (!aiResponse.patches || aiResponse.patches.length === 0) return;

    let current = resumeData as unknown as Record<string, unknown>;
    for (const patch of aiResponse.patches) {
      current = applyPatch(current, patch);
    }
    setResumeData(current as unknown as Resume);
    generateFromBlocks();

    if (autoCompileAfterAi && compileStatus !== 'compiling') {
      compile();
    }

    setActivePreviewMsgId(null);
  }, [resumeData, setResumeData, generateFromBlocks, autoCompileAfterAi, compile, compileStatus]);

  const handleDismissPatches = useCallback((msgId: string) => {
    setActivePreviewMsgId(null);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, aiResponse: undefined } : m))
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {aiDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => {
          toggleAiDrawer();
          clearAiContext();
        }} />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-zinc-900 border-l border-zinc-700 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          aiDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-900">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-amber-400">KCV AI</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCompileAfterAi}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  useEditorStore.getState().setAutoCompileAfterAi(enabled);
                  localStorage.setItem('kcv-auto-compile', String(enabled));
                }}
                className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500/30"
              />
              Auto-compile
            </label>
            <button
              onClick={() => {
                toggleAiDrawer();
                clearAiContext();
              }}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Provider status */}
        {hasApiKey === false && (
          <div className="mx-4 mt-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <p className="text-xs text-zinc-400 leading-relaxed">
              No AI provider configured. Set one of:{' '}
              <code className="text-amber-400">OPENAI_API_KEY</code>,{' '}
              <code className="text-amber-400">ANTHROPIC_API_KEY</code>,{' '}
              <code className="text-amber-400">OPENROUTER_API_KEY</code>, or{' '}
              <code className="text-amber-400">OLLAMA_BASE_URL</code>
            </p>
          </div>
        )}

        {/* Tab switcher */}
        {hasApiKey !== false && (
          <div className="px-4 pt-3 flex gap-1 border-b border-zinc-800/50">
            <button
              onClick={() => setActiveTab('chat')}
              className={`text-xs px-3 py-1.5 rounded-t-md border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('tailor')}
              className={`text-xs px-3 py-1.5 rounded-t-md border-b-2 transition-colors ${
                activeTab === 'tailor'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Job Tailor
            </button>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'tailor' ? (
          <div className="flex-1 overflow-hidden">
            <JobTailorPanel />
          </div>
        ) : (
          <>
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <p className="text-xs text-zinc-500 mb-2">Quick actions</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`text-xs font-medium mb-1 ${
                msg.role === 'user' ? 'text-amber-400' : 'text-zinc-400'
              }`}>
                {msg.role === 'user' ? 'You' : 'KCV AI'}
                {msg.error && <span className="ml-2 text-red-400">(error)</span>}
              </div>
              <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-800/50 text-zinc-300'
              } ${msg.error ? 'border border-red-500/30' : ''}`}>
                {msg.content}
              </div>

              {/* Patch preview */}
              {msg.aiResponse && msg.aiResponse.patches && msg.aiResponse.patches.length > 0 && (
                <div className="mt-2">
                  {activePreviewMsgId === msg.id ? (
                    <AiPatchPreview
                      response={msg.aiResponse}
                      onDismiss={() => handleDismissPatches(msg.id)}
                    />
                  ) : (
                    <div className="p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-400">
                          {msg.aiResponse.patches.length} change{msg.aiResponse.patches.length !== 1 ? 's' : ''} suggested
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleApplyPatches(msg.aiResponse!);
                            }}
                            className="text-xs px-2 py-1 rounded bg-green-600/30 text-green-400 hover:bg-green-600/50 transition-colors"
                          >
                            Apply All
                          </button>
                          <button
                            onClick={() => handleDismissPatches(msg.id)}
                            className="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {msg.aiResponse.patches.map((patch, i) => (
                          <div key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              patch.op === 'replace' ? 'bg-blue-500/20 text-blue-400' :
                              patch.op === 'add' ? 'bg-green-500/20 text-green-400' :
                              patch.op === 'remove' ? 'bg-red-500/20 text-red-400' :
                              'bg-zinc-700 text-zinc-300'
                            }`}>
                              {patch.op}
                            </span>
                            <code className="text-zinc-500 truncate">{patch.path}</code>
                          </div>
                        ))}
                      </div>
                      {msg.aiResponse.warnings && msg.aiResponse.warnings.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {msg.aiResponse.warnings.map((w, i) => (
                            <div key={i} className="text-xs text-amber-400/80 flex items-start gap-1">
                              <span>⚠</span>
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {hasApiKey !== false && (
          <div className="px-4 py-3 border-t border-zinc-800">
            <AiInput onSend={sendMessage} disabled={isLoading} />
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
