import { NextResponse } from 'next/server';
import { chat, getProviderConfigFromSettings, type AiProvider } from '@/lib/ai/provider';

type RequestProvider = AiProvider | 'disabled';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, resumeJson, provider, apiKey } = body as {
      messages: import('@/lib/ai/provider').AiMessage[];
      resumeJson: string;
      provider: AiProvider;
      apiKey: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 });
    }

    if (!resumeJson || typeof resumeJson !== 'string') {
      return NextResponse.json({ error: 'resumeJson is required' }, { status: 400 });
    }

    if (!provider || provider === 'none' || provider === 'disabled') {
      return NextResponse.json({
        error: 'No AI provider configured',
        hint: 'Go to Settings → AI Provider to configure a provider and API key.',
        provider: 'none',
      }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        error: 'API key is missing for the selected provider',
        hint: 'Add your API key in Settings → AI Provider.',
        provider,
      }, { status: 400 });
    }

    const config = getProviderConfigFromSettings(provider);

    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = messages.map(
      (m) => ({ role: m.role, content: m.content })
    );

    const result = await chat(formattedMessages, resumeJson, { provider, apiKey });

    return NextResponse.json({
      response: result.response,
      provider: result.provider,
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Settings are client-side only now; server has no persistent config
  return NextResponse.json({
    provider: 'none',
    available: false,
    models: [],
    note: 'Configure AI provider in browser Settings',
  });
}