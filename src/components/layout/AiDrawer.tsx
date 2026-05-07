'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/resume/editorStore';
import { loadSettings, maskKey, type AiProviderType } from '@/lib/settings/settingsStore';
import { Settings, Sparkles, Send, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface AiMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const PROVIDER_LABELS: Record<AiProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
  ollama: 'Ollama Local',
  disabled: 'Disabled',
};

export function AiDrawer() {
  const { aiDrawerOpen, toggleAiDrawer, resumeData } = useEditorStore();
  const [settings, setSettings] = useState(loadSettings());
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (aiDrawerOpen) {
      setSettings(loadSettings());
    }
  }, [aiDrawerOpen]);

  const provider = settings.ai.provider;
  const isConfigured = provider !== 'disabled' && !!(
    (provider === 'openai' && settings.ai.openaiKey) ||
    (provider === 'anthropic' && settings.ai.anthropicKey) ||
    (provider === 'openrouter' && settings.ai.openrouterKey) ||
    (provider === 'ollama' && settings.ai.ollamaBaseUrl)
  );

  const handleSend = async () => {
    if (!input.trim() || !isConfigured) return;

    const userMessage: AiMessageItem = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    const apiKey = provider === 'openai' ? settings.ai.openaiKey
      : provider === 'anthropic' ? settings.ai.anthropicKey
      : provider === 'openrouter' ? settings.ai.openrouterKey
      : provider === 'ollama' ? settings.ai.ollamaBaseUrl
      : '';

    try {
      const resumeJson = JSON.stringify(resumeData, null, 2);
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: userMessage.id, role: 'user' as const, content: input, timestamp: Date.now() }, ...messages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: 0 }))],
          resumeJson,
          provider,
          apiKey,
        }),
      });
      const data = await res.json() as { response?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (data.response) {
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response! }]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {aiDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={toggleAiDrawer}
        />
      )}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-700/80 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          aiDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800">
          <h2 className="font-semibold text-sm text-amber-400 flex items-center gap-2">
            <Sparkles size={13} />
            AI Assistant
          </h2>
          <button
            onClick={toggleAiDrawer}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!isConfigured ? (
          <div className="p-4">
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertCircle size={14} />
                <span className="text-sm font-medium">AI not configured</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                {provider === 'disabled'
                  ? 'AI provider is disabled. Enable it in Settings.'
                  : `No API key set for ${PROVIDER_LABELS[provider] || provider}.`}
              </p>
              <a
                href="/settings"
                onClick={toggleAiDrawer}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
              >
                <Settings size={11} />
                Open Settings
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100%-3rem)]">
            {/* Provider badge */}
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-zinc-400">{PROVIDER_LABELS[provider]}</span>
              {provider !== 'ollama' && (
                <span className="text-xs text-zinc-600 font-mono ml-1">
                  {provider === 'openai' ? maskKey(settings.ai.openaiKey)
                    : provider === 'anthropic' ? maskKey(settings.ai.anthropicKey)
                    : maskKey(settings.ai.openrouterKey)}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-zinc-500 text-center mt-8">
                  Ask anything about your CV — improve content, fix phrasing, tailor for a job…
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn('text-xs', msg.role === 'user' ? 'text-zinc-300' : 'text-zinc-400')}>
                  <span className="font-medium text-zinc-500">{msg.role === 'user' ? 'You' : 'AI'}: </span>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Loader size={11} className="animate-spin" />
                  Thinking…
                </div>
              )}
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={11} />
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your CV…"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={11} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}