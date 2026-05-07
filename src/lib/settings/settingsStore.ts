export type AiProviderType = 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'disabled';
export type EditorModePreference = 'blocks' | 'latex';
export type ZoomPreference = 'fit-width' | 100 | 125 | 150 | 200;

export interface ProfileData {
  displayName: string;
  defaultRole: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  defaultLanguage: string;
  defaultTone: string;
}

export interface AiSettings {
  provider: AiProviderType;
  openaiKey: string;
  anthropicKey: string;
  openrouterKey: string;
  ollamaBaseUrl: string;
}

export interface CompileSettings {
  autoCompile: boolean;
  defaultEditorMode: EditorModePreference;
  defaultZoom: ZoomPreference;
}

export interface AppSettings {
  ai: AiSettings;
  compile: CompileSettings;
  profile: ProfileData;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: 'disabled',
    openaiKey: '',
    anthropicKey: '',
    openrouterKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
  },
  compile: {
    autoCompile: false,
    defaultEditorMode: 'blocks',
    defaultZoom: 'fit-width',
  },
  profile: {
    displayName: '',
    defaultRole: '',
    email: '',
    phone: '',
    website: '',
    github: '',
    linkedin: '',
    defaultLanguage: 'en',
    defaultTone: 'professional',
  },
};

const STORAGE_KEY = 'kartal-cv-settings';

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage full or unavailable
  }
}

export function loadSettings(): AppSettings {
  const raw = safeRead(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  safeWrite(STORAGE_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function exportSettings(): string {
  const raw = safeRead(STORAGE_KEY);
  return raw || JSON.stringify(DEFAULT_SETTINGS);
}

export function importSettings(json: string): AppSettings {
  const parsed = JSON.parse(json) as Partial<AppSettings>;
  const current = loadSettings();
  const merged: AppSettings = {
    ai: { ...current.ai, ...parsed.ai },
    compile: { ...current.compile, ...parsed.compile },
    profile: { ...current.profile, ...parsed.profile },
  };
  saveSettings(merged);
  return merged;
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}