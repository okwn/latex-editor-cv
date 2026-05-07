'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEditorStore } from '@/lib/resume/editorStore';
import {
  LayoutDashboard,
  Blocks,
  PlusSquare,
  Camera,
  Sparkles,
  Settings,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RailItem {
  id: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}

interface AppIconRailProps {
  showPreview?: boolean;
  onTogglePreview?: () => void;
  showBlockStore?: boolean;
  onToggleBlockStore?: () => void;
}

export function AppIconRail({
  showPreview,
  onTogglePreview,
  showBlockStore,
  onToggleBlockStore,
}: AppIconRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleAiDrawer } = useEditorStore();

  const isEditor = pathname?.startsWith('/editor/');

  const items: RailItem[] = [
    {
      id: 'dashboard',
      icon: ({ size, className }) => <LayoutDashboard size={size} className={className} />,
      label: 'Dashboard',
      href: '/dashboard',
    },
    ...(isEditor
      ? [
          {
            id: 'blocks',
            icon: ({ size, className }: { size: number; className?: string }) => (
              <Blocks size={size} className={className} />
            ),
            label: 'Blocks',
            onClick: () => {},
          },
        ]
      : []),
    ...(isEditor && onToggleBlockStore
      ? [
          {
            id: 'block-store',
            icon: ({ size, className }: { size: number; className?: string }) => (
              <PlusSquare size={size} className={className} />
            ),
            label: 'Block Store',
            onClick: onToggleBlockStore,
            active: showBlockStore,
          },
        ]
      : []),
    ...(isEditor
      ? [
          {
            id: 'ai',
            icon: ({ size, className }: { size: number; className?: string }) => (
              <Sparkles size={size} className={className} />
            ),
            label: 'AI Assistant',
            onClick: () => toggleAiDrawer(),
          },
          {
            id: 'snapshots',
            icon: ({ size, className }: { size: number; className?: string }) => (
              <Camera size={size} className={className} />
            ),
            label: 'Snapshots',
            onClick: () => {},
          },
        ]
      : []),
    {
      id: 'settings',
      icon: ({ size, className }: { size: number; className?: string }) => (
        <Settings size={size} className={className} />
      ),
      label: 'Settings',
      href: '/settings',
    },
  ];

  return (
    <div className="w-10 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-2 gap-1 shrink-0">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.active || (item.href && pathname === item.href);

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'w-full flex items-center justify-center py-2.5 rounded transition-all',
                isActive
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              )}
              title={item.label}
            >
              <Icon size={16} className={isActive ? 'text-amber-400' : ''} />
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'w-full flex items-center justify-center py-2.5 rounded transition-all',
              item.active
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            )}
            title={item.label}
          >
            <Icon size={16} className={item.active ? 'text-amber-400' : ''} />
          </button>
        );
      })}

      {isEditor && onTogglePreview && (
        <>
          <div className="flex-1" />
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
        </>
      )}
    </div>
  );
}