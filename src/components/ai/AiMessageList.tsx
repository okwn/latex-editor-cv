'use client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  patches?: Array<{ op: string; path: string; value: unknown }>;
  error?: string;
}

interface AiMessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function AiMessageList({ messages, isLoading }: AiMessageListProps) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-1">
          <div className={`text-xs font-medium ${
            msg.role === 'user' ? 'text-amber-400' : 'text-zinc-500'
          }`}>
            {msg.role === 'user' ? 'You' : 'KCV AI'}
            {msg.error && <span className="ml-2 text-red-400">(error)</span>}
          </div>
          <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
            msg.role === 'user'
              ? 'bg-zinc-800 text-zinc-200'
              : msg.error
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-zinc-800/50 text-zinc-300'
          }`}>
            {msg.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
          KCV AI is thinking...
        </div>
      )}
    </div>
  );
}