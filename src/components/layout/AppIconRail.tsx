'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEditorStore } from '@/lib/resume/editorStore';
import {
  LayoutDashboard,
  Blocks,
  PlusSquare,
  History,
  Sparkles,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RailItem {
  id: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface AppIconRailProps {
  showBlocks: boolean;
  onToggleBlocks: () => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  showBlockStore?: boolean;
  onToggleBlockStore?: () => void;
  showSnapshots?: boolean;
  onToggleSnapshots?: () => void;
}

export function AppIconRail({
  showBlocks,
  onToggleBlocks,
  showPreview,
  onTogglePreview,
  showBlockStore,
  onToggleBlockStore,
  showSnapshots,
  onToggleSnapshots,
}: AppIconRailProps) {
  const pathname = usePathname();
  const { toggleAiDrawer } = useEditorStore();

  const isEditor = pathname?.startsWith('/editor/');

  return (
    <div className="w-10 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-2 gap-1 shrink-0">
      {/* Dashboard — always shown */}
      <Link
        href="/dashboard"
        className={cn(
          'w-full flex items-center justify-center py-2.5 rounded transition-all',
          pathname === '/dashboard'
            ? 'bg-amber-500/10 text-amber-400'
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
        )}
        title="Dashboard"
      >
        <LayoutDashboard size={16} />
      </Link>

      {/* Editor-only icons */}
      {isEditor && (
        <>
          <div className="w-6 border-t border-zinc-800 my-1" />

          {/* Blocks toggle */}
          <button
            onClick={onToggleBlocks}
            className={cn(
              'w-full flex items-center justify-center py-2.5 rounded transition-all',
              showBlocks
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            )}
            title="Blocks"
          >
            <Blocks size={16} />
          </button>

          {/* Block Store */}
          <button
            onClick={onToggleBlockStore}
            className={cn(
              'w-full flex items-center justify-center py-2.5 rounded transition-all',
              showBlockStore
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            )}
            title="Block Store"
          >
            <PlusSquare size={16} />
          </button>

          {/* Snapshots */}
          {onToggleSnapshots && (
            <button
              onClick={onToggleSnapshots}
              className={cn(
                'w-full flex items-center justify-center py-2.5 rounded transition-all',
                showSnapshots
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              )}
              title="Snapshots"
            >
              <History size={16} />
            </button>
          )}

          {/* AI */}
          <button
            onClick={toggleAiDrawer}
            className="w-full flex items-center justify-center py-2.5 rounded text-zinc-500 hover:bg-zinc-800 hover:text-amber-400 transition-all"
            title="AI Assistant"
          >
            <Sparkles size={16} />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Preview toggle */}
          {onTogglePreview && (
            <button
              onClick={onTogglePreview}
              className={cn(
                'w-full flex items-center justify-center py-2.5 rounded transition-all',
                showPreview
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              )}
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </>
      )}

      {/* Settings — always shown */}
      <Link
        href="/settings"
        className={cn(
          'mt-auto w-full flex items-center justify-center py-2.5 rounded transition-all',
          pathname === '/settings'
            ? 'bg-amber-500/10 text-amber-400'
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
        )}
        title="Settings"
      >
        <Settings size={16} />
      </Link>
    </div>
  );
}