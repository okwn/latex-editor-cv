import { NextResponse } from 'next/server';
import { chat, getProviderConfig, type AiMessage } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, resumeJson } = body as {
      messages: AiMessage[];
      resumeJson: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 });
    }

    if (!resumeJson || typeof resumeJson !== 'string') {
      return NextResponse.json({ error: 'resumeJson is required' }, { status: 400 });
    }

    const config = getProviderConfig();

    if (!config.available) {
      return NextResponse.json({
        error: 'No AI provider configured',
        hint: 'Set one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, or OLLAMA_BASE_URL',
        provider: 'none',
      }, { status: 400 });
    }

    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = messages.map(
      (m: AiMessage) => ({ role: m.role, content: m.content })
    );

    const result = await chat(formattedMessages, resumeJson);

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
  const config = getProviderConfig();
  return NextResponse.json({
    provider: config.provider,
    available: config.available,
    models: config.models,
  });
}