'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function LayoutShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden', className)}>
      {children}
    </div>
  );
}
