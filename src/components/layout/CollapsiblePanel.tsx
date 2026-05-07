'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function CollapsiblePanel({
  children,
  collapsed = false,
  width = '18rem',
  className,
}: {
  children: ReactNode;
  collapsed?: boolean;
  width?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'border-r border-zinc-800 flex flex-col bg-zinc-900/40 shrink-0 transition-all duration-200 overflow-hidden',
        className
      )}
      style={{ width: collapsed ? '0px' : width }}
    >
      <div className="w-[18rem] h-full overflow-auto">{children}</div>
    </aside>
  );
}