'use client';

import { useEditorStore } from '@/lib/resume/editorStore';

export function HeaderBlockEditor() {
  const { resumeData, setResumeData } = useEditorStore();
  const { personal } = resumeData;

  const update = <K extends keyof typeof personal>(field: K, value: typeof personal[K]) => {
    setResumeData({
      ...resumeData,
      personal: { ...personal, [field]: value },
    });
  };

  return (
    <div className="space-y-4 px-1">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Full Name</label>
        <input
          type="text"
          value={personal.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          placeholder="Your full name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Role / Title</label>
        <input
          type="text"
          value={personal.role}
          onChange={(e) => update('role', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          placeholder="e.g. Senior Software Engineer"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Email</label>
          <input
            type="email"
            value={personal.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Phone</label>
          <input
            type="text"
            value={personal.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">GitHub</label>
          <input
            type="text"
            value={personal.github}
            onChange={(e) => update('github', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Website</label>
          <input
            type="text"
            value={personal.website || ''}
            onChange={(e) => update('website', e.target.value || undefined)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">LinkedIn (optional)</label>
        <input
          type="text"
          value={personal.linkedin || ''}
          onChange={(e) => update('linkedin', e.target.value || undefined)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Location</label>
        <input
          type="text"
          value={personal.location || ''}
          onChange={(e) => update('location', e.target.value || undefined)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          placeholder="City, Country"
        />
      </div>
    </div>
  );
}