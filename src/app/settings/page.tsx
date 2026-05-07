'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Download, Upload, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';
import { loadSettings, saveSettings, clearSettings, exportSettings, importSettings, maskKey, type AppSettings, type AiProviderType, type EditorModePreference, type ZoomPreference } from '@/lib/settings/settingsStore';

const PROVIDERS: { value: AiProviderType; label: string }[] = [
  { value: 'disabled', label: 'Disabled' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'ollama', label: 'Ollama Local' },
];

const ZOOM_OPTIONS: { value: ZoomPreference; label: string }[] = [
  { value: 'fit-width', label: 'Fit Width' },
  { value: 100, label: '100%' },
  { value: 125, label: '125%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
];

const EDITOR_MODES: { value: EditorModePreference; label: string }[] = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'latex', label: 'LaTeX' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [testingProvider, setTestingProvider] = useState<AiProviderType | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [importError, setImportError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSave = useCallback(() => {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleTestProvider = useCallback(async () => {
    if (!settings) return;
    const { provider } = settings.ai;
    if (provider === 'disabled') {
      setTestResult({ ok: false, message: 'Provider is disabled' });
      return;
    }
    setTestingProvider(provider);
    setTestResult(null);

    const testMessage = { role: 'user' as const, content: 'Hi' };
    const body = {
      messages: [testMessage],
      resumeJson: '{}',
      provider: settings.ai.provider,
      apiKey: settings.ai.provider === 'openai' ? settings.ai.openaiKey
        : settings.ai.provider === 'anthropic' ? settings.ai.anthropicKey
        : settings.ai.provider === 'openrouter' ? settings.ai.openrouterKey
        : settings.ai.provider === 'ollama' ? settings.ai.ollamaBaseUrl
        : '',
    };

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setTestResult({ ok: true, message: `${provider} connection successful` });
      } else {
        setTestResult({ ok: false, message: data.error || 'Connection failed' });
      }
    } catch (e) {
      setTestResult({ ok: false, message: 'Network error' });
    } finally {
      setTestingProvider(null);
    }
  }, [settings]);

  const handleExport = useCallback(() => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kartal-cv-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (ev.target?.result) {
          const imported = importSettings(ev.target.result as string);
          setSettings(imported);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      } catch {
        setImportError('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleClearAll = useCallback(() => {
    clearSettings();
    setSettings(loadSettings());
    setShowClearConfirm(false);
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft size={15} />
          </Link>
          <span className="font-semibold text-sm">Settings</span>
          {saved && (
            <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
              <CheckCircle size={11} /> Saved
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Security warning */}
        <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-4 flex gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-200 font-medium">For local personal use only</p>
            <p className="text-xs text-amber-300/70 mt-1">
              Do not store production secrets on a shared or public machine. API keys are stored in browser localStorage and are not encrypted.
            </p>
          </div>
        </div>

        {/* AI Provider */}
        <section>
          <h2 className="text-base font-semibold text-zinc-100 mb-4">AI Provider</h2>
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Provider</label>
                <select
                  value={settings.ai.provider}
                  onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, provider: e.target.value as AiProviderType } })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {settings.ai.provider === 'openai' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">OpenAI API Key</label>
                  <input
                    type="password"
                    value={settings.ai.openaiKey}
                    onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, openaiKey: e.target.value } })}
                    placeholder="sk-..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                  {settings.ai.openaiKey && <p className="text-xs text-zinc-500 mt-1 font-mono">{maskKey(settings.ai.openaiKey)}</p>}
                </div>
              )}

              {settings.ai.provider === 'anthropic' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Anthropic API Key</label>
                  <input
                    type="password"
                    value={settings.ai.anthropicKey}
                    onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, anthropicKey: e.target.value } })}
                    placeholder="sk-ant-..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                  {settings.ai.anthropicKey && <p className="text-xs text-zinc-500 mt-1 font-mono">{maskKey(settings.ai.anthropicKey)}</p>}
                </div>
              )}

              {settings.ai.provider === 'openrouter' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">OpenRouter API Key</label>
                  <input
                    type="password"
                    value={settings.ai.openrouterKey}
                    onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, openrouterKey: e.target.value } })}
                    placeholder="sk-or-..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                  {settings.ai.openrouterKey && <p className="text-xs text-zinc-500 mt-1 font-mono">{maskKey(settings.ai.openrouterKey)}</p>}
                </div>
              )}

              {settings.ai.provider === 'ollama' && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Ollama Base URL</label>
                  <input
                    type="text"
                    value={settings.ai.ollamaBaseUrl}
                    onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, ollamaBaseUrl: e.target.value } })}
                    placeholder="http://localhost:11434"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
              )}

              {settings.ai.provider !== 'disabled' && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleTestProvider}
                    disabled={testingProvider !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50 transition-colors text-xs"
                  >
                    {testingProvider ? <Loader size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                    Test Provider
                  </button>
                  {testResult && (
                    <span className={`text-xs flex items-center gap-1 ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.ok ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {testResult.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Compile Settings */}
        <section>
          <h2 className="text-base font-semibold text-zinc-100 mb-4">Compile</h2>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-200">Auto compile after block changes</p>
                <p className="text-xs text-zinc-500">Automatically regenerate PDF when editing blocks</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, compile: { ...settings.compile, autoCompile: !settings.compile.autoCompile } })}
                className={`w-10 h-5 rounded-full transition-colors relative ${settings.compile.autoCompile ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.compile.autoCompile ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Default editor mode</label>
              <div className="flex gap-2">
                {EDITOR_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSettings({ ...settings, compile: { ...settings.compile, defaultEditorMode: m.value } })}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors ${settings.compile.defaultEditorMode === m.value ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Default PDF zoom</label>
              <select
                value={settings.compile.defaultZoom}
                onChange={(e) => setSettings({ ...settings, compile: { ...settings.compile, defaultZoom: e.target.value as ZoomPreference } })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
              >
                {ZOOM_OPTIONS.map((z) => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Data */}
        <section>
          <h2 className="text-base font-semibold text-zinc-100 mb-4">Data</h2>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-sm"
              >
                <Download size={13} />
                Export all data
              </button>
              <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors text-sm cursor-pointer">
                <Upload size={13} />
                Import data
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              {importError && <span className="text-xs text-red-400">{importError}</span>}
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-900/20 text-red-400 border border-red-800/30 hover:bg-red-900/30 transition-colors text-sm"
              >
                <Trash2 size={13} />
                Clear all local data
              </button>
            </div>
          </div>
        </section>

        <div className="pt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>

        {/* Clear confirmation */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
              <h3 className="text-base font-semibold text-zinc-100 mb-2">Clear all data?</h3>
              <p className="text-sm text-zinc-400 mb-5">This will delete all CVs, snapshots, and settings. This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                >
                  Clear Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}