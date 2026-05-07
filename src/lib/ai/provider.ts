/**
 * AI Provider abstraction layer.
 * Supports: OpenAI, Anthropic, OpenRouter, Ollama (local).
 *
 * Credentials are passed via request body (provider + apiKey from browser settings).
 * Environment variables are no longer used for API keys.
 */

export type AiProvider = 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'disabled' | 'none';

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

export function getProviderModels(provider: AiProvider): string[] {
  const models: Record<AiProvider, string[]> = {
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    openrouter: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro'],
    ollama: ['llama3', 'mistral', 'codellama'],
    disabled: [],
    none: [],
  };
  return models[provider] || [];
}

export function getProviderConfigFromSettings(provider: AiProvider): ProviderConfig {
  return {
    provider,
    available: provider !== 'none' && provider !== 'disabled',
    models: getProviderModels(provider),
  };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function anthropicChat(messages: ChatMessage[], resumeJson: string, apiKey: string, model?: string): Promise<string> {
  const resolvedModel = model || 'claude-3-5-sonnet-20241022';

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
      model: resolvedModel,
      max_tokens: 4096,
      system: systemContent,
      messages: formatted.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  return data.content?.[0]?.text || '';
}

async function openaiChat(messages: ChatMessage[], resumeJson: string, apiKey: string, model?: string): Promise<string> {
  const resolvedModel = model || 'gpt-4o';

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages: [{ role: 'system', content: systemContent }, ...formatted.map(({ role, content }) => ({ role, content }))],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function openrouterChat(messages: ChatMessage[], resumeJson: string, apiKey: string, model?: string): Promise<string> {
  const resolvedModel = model || 'anthropic/claude-3.5-sonnet';

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages: [{ role: 'system', content: systemContent }, ...formatted.map(({ role, content }) => ({ role, content }))],
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function ollamaChat(messages: ChatMessage[], resumeJson: string, baseUrl: string, model?: string): Promise<string> {
  const resolvedModel = model || 'llama3';
  const resolvedUrl = baseUrl || 'http://localhost:11434';

  const systemContent = CV_TAILOR_SYSTEM_PROMPT + `\n\nCurrent CV data:\n${resumeJson}`;
  const formatted = messages.filter(m => m.role !== 'system');

  const res = await fetch(`${resolvedUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: resolvedModel,
      messages: [{ role: 'system', content: systemContent }, ...formatted.map(({ role, content }) => ({ role, content }))],
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json() as { message?: { content?: string } };
  return data.message?.content || '';
}

export interface ChatOptions {
  provider: AiProvider;
  apiKey: string;
}

export async function chat(
  messages: ChatMessage[],
  resumeJson: string,
  opts: ChatOptions
): Promise<{ response: string; provider: AiProvider }> {
  const { provider, apiKey } = opts;

  switch (provider) {
    case 'anthropic':
      return { response: await anthropicChat(messages, resumeJson, apiKey), provider };
    case 'openai':
      return { response: await openaiChat(messages, resumeJson, apiKey), provider };
    case 'openrouter':
      return { response: await openrouterChat(messages, resumeJson, apiKey), provider };
    case 'ollama':
      return { response: await ollamaChat(messages, resumeJson, apiKey), provider };
    default:
      throw new Error('No AI provider configured or provider is disabled');
  }
}