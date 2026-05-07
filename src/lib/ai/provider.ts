/**
 * AI Provider abstraction layer.
 * Supports: OpenAI, Anthropic, OpenRouter, Ollama (local).
 *
 * Keys read from environment variables:
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, OLLAMA_BASE_URL
 *
 * Set PREFERRED_AI_PROVIDER to override default detection order:
 *   openai | anthropic | openrouter | ollama
 */

export type AiProvider = 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'none';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ProviderConfig {
  provider: AiProvider;
  available: boolean;
  models: string[];
}

import { CV_TAILOR_SYSTEM_PROMPT } from './prompts/cvTailorPrompt';

function getEnv(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

function detectProvider(): AiProvider {
  const preferred = getEnv('PREFERRED_AI_PROVIDER', '').toLowerCase();
  if (preferred && ['openai', 'anthropic', 'openrouter', 'ollama'].includes(preferred)) {
    return preferred as AiProvider;
  }
  if (getEnv('ANTHROPIC_API_KEY')) return 'anthropic';
  if (getEnv('OPENAI_API_KEY')) return 'openai';
  if (getEnv('OPENROUTER_API_KEY')) return 'openrouter';
  if (getEnv('OLLAMA_BASE_URL')) return 'ollama';
  return 'none';
}

export function getProviderConfig(): ProviderConfig {
  const provider = detectProvider();
  const models: Record<AiProvider, string[]> = {
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    openrouter: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro'],
    ollama: ['llama3', 'mistral', 'codellama'],
    none: [],
  };

  return {
    provider,
    available: provider !== 'none',
    models: models[provider] || [],
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function anthropicChat(messages: ChatMessage[], resumeJson: string): Promise<string> {
  const apiKey = getEnv('ANTHROPIC_API_KEY');
  const model = getEnv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022');

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemContent,
      messages: formatted.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  return data.content?.[0]?.text || '';
}

async function openaiChat(messages: ChatMessage[], resumeJson: string): Promise<string> {
  const apiKey = getEnv('OPENAI_API_KEY');
  const model = getEnv('OPENAI_MODEL', 'gpt-4o');

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemContent }, ...formatted.map(({ role, content }) => ({ role, content }))],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function openrouterChat(messages: ChatMessage[], resumeJson: string): Promise<string> {
  const apiKey = getEnv('OPENROUTER_API_KEY');
  const model = getEnv('OPENROUTER_MODEL', 'anthropic/claude-3.5-sonnet');

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemContent }, ...formatted.map(({ role, content }) => ({ role, content }))],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function ollamaChat(messages: ChatMessage[], resumeJson: string): Promise<string> {
  const baseUrl = getEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
  const model = getEnv('OLLAMA_MODEL', 'llama3');

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemContent }, ...formatted.map(({ role, content }) => ({ role, content }))],
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json() as { message?: { content?: string } };
  return data.message?.content || '';
}

export async function chat(
  messages: ChatMessage[],
  resumeJson: string
): Promise<{ response: string; provider: AiProvider }> {
  const provider = detectProvider();

  switch (provider) {
    case 'anthropic':
      return { response: await anthropicChat(messages, resumeJson), provider };
    case 'openai':
      return { response: await openaiChat(messages, resumeJson), provider };
    case 'openrouter':
      return { response: await openrouterChat(messages, resumeJson), provider };
    case 'ollama':
      return { response: await ollamaChat(messages, resumeJson), provider };
    default:
      throw new Error('No AI provider configured');
  }
}

export { detectProvider };