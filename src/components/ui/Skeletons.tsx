'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-28" />
        <div className="flex-1" />
        <Skeleton className="h-5 w-16" />
      </div>
      {/* Editor lines skeleton */}
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-4 w-8 shrink-0" />
            <Skeleton className={`h-4 ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PdfPreviewSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      {/* PDF preview skeleton */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-[600px] w-full rounded-lg" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlocksPanelSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className={`h-3 flex-1 ${i % 2 === 0 ? 'w-28' : 'w-36'}`} />
        </div>
      ))}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <Skeleton className="h-8 w-full mx-auto" />
      </div>
    </div>
  );
}
