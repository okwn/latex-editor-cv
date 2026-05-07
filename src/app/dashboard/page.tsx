'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  Copy,
  Trash2,
  MoreHorizontal,
  Settings,
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  Camera,
  ArrowRight,
  X,
} from 'lucide-react';
import { listCvDocuments, createCvDocument, deleteCvDocument, duplicateCvDocument, getTemplateCards } from '@/lib/resume/documentStore';
import { getSnapshotCount, listSnapshots, formatSnapshotDate } from '@/lib/resume/snapshotStore';
import type { CvDocument } from '@/types/cv';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DeleteModal({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-zinc-100 mb-2">Delete &ldquo;{title}&rdquo;?</h3>
        <p className="text-sm text-zinc-400 mb-5">This cannot be undone. The CV and all its snapshots will be permanently removed.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

function CvCard({ doc, onDelete, onDuplicate }: { doc: CvDocument; onDelete: (id: string) => void; onDuplicate: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => router.push(`/editor/${doc.id}`)}
            className="flex-1 text-left"
          >
            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center mb-3">
              <FileText size={14} className="text-zinc-400" />
            </div>
            <h3 className="font-medium text-zinc-100 text-sm mb-0.5 truncate">{doc.title}</h3>
            <p className="text-xs text-zinc-500">{doc.templateId}</p>
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-20 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 w-36 text-xs">
                  <button
                    onClick={() => { router.push(`/editor/${doc.id}`); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => { onDuplicate(doc.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <Copy size={11} /> Duplicate
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDate(doc.updatedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Camera size={10} />
            {getSnapshotCount(doc.id)}
          </span>
          {doc.lastCompiledAt && (
            <span className="flex items-center gap-1 text-green-500/70">
              <CheckCircle2 size={10} /> PDF
            </span>
          )}
        </div>
      </div>

      {confirmDelete && (
        <DeleteModal
          title={doc.title}
          onConfirm={() => { onDelete(doc.id); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

function TemplateCard({ id, name, description, onSelect }: { id: string; name: string; description: string; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 hover:bg-zinc-900/60 transition-all text-left w-full group"
    >
      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
        <Layers size={14} className="text-zinc-400" />
      </div>
      <h4 className="font-medium text-zinc-100 text-sm mb-1">{name}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </button>
  );
}

function HeroSection({ onNewCv }: { onNewCv: () => void }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 mb-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
            Create tailored LaTeX CVs with AI
          </h1>
          <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
            Build professional CVs using block editors. Compile to PDF, get AI suggestions, and keep full control with raw LaTeX access.
          </p>
        </div>
        <button
          onClick={onNewCv}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} />
          New CV
        </button>
      </div>
    </div>
  );
}

function RecentSnapshotCard({ cvId, onOpen }: { cvId: string; onOpen: (id: string) => void }) {
  const snapshots = listSnapshots(cvId);
  if (snapshots.length === 0) return null;
  const latest = snapshots[0];
  return (
    <button
      onClick={() => onOpen(cvId)}
      className="bg-zinc-900/30 border border-zinc-800/60 rounded-lg p-3 hover:border-zinc-700/80 transition-colors text-left w-full"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Camera size={11} className="text-amber-500/70" />
        <span className="text-xs text-zinc-400 font-medium">Latest snapshot</span>
      </div>
      <p className="text-xs text-zinc-300 truncate">{latest.label}</p>
      <p className="text-xs text-zinc-600 mt-0.5">{formatSnapshotDate(latest.createdAt)}</p>
    </button>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const router = useRouter();

  const reload = useCallback(() => {
    setDocuments(listCvDocuments());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreate = (templateId: string) => {
    const doc = createCvDocument(templateId, newTitle.trim() || undefined);
    setShowNewModal(false);
    setNewTitle('');
    router.push(`/editor/${doc.id}`);
  };

  const handleDelete = (id: string) => {
    deleteCvDocument(id);
    reload();
  };

  const handleDuplicate = (id: string) => {
    duplicateCvDocument(id);
    reload();
  };

  const templates = getTemplateCards();
  const hasCvs = documents.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top nav */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-zinc-900">K</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">CV-Maker</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/settings" className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" title="Settings">
              <Settings size={15} />
            </Link>
            <Link href="/profile" className="p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" title="Profile">
              <User size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <HeroSection onNewCv={() => setShowNewModal(true)} />

        {/* My CVs */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
              <FileText size={15} className="text-zinc-400" />
              My CVs
            </h2>
            {hasCvs && (
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Plus size={12} /> New
              </button>
            )}
          </div>

          {!hasCvs ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                <FileText size={22} className="text-zinc-600" />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">No CVs yet</h3>
              <p className="text-xs text-zinc-500 mb-5">Create your first CV to get started.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium text-sm transition-colors"
              >
                <Plus size={13} />
                Start from KCV Modern
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <CvCard key={doc.id} doc={doc} onDelete={handleDelete} onDuplicate={handleDuplicate} />
              ))}
            </div>
          )}
        </section>

        {/* Templates + Recent snapshots side by side when CVs exist */}
        {hasCvs && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2 mb-4">
                <Layers size={15} className="text-zinc-400" />
                Templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((tpl) => (
                  <TemplateCard key={tpl.id} id={tpl.id} name={tpl.name} description={tpl.description} onSelect={handleCreate} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2 mb-4">
                <Camera size={15} className="text-zinc-400" />
                Recent Snapshots
              </h2>
              <div className="space-y-2">
                {documents.slice(0, 4).map((doc) => (
                  <RecentSnapshotCard key={doc.id} cvId={doc.id} onOpen={(id) => router.push(`/editor/${id}`)} />
                ))}
                {documents.every(doc => listSnapshots(doc.id).length === 0) && (
                  <p className="text-xs text-zinc-600 py-4 text-center">No snapshots yet. Take a snapshot to save a restore point.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {!hasCvs && (
          <section>
            <h2 className="text-base font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <Layers size={15} className="text-zinc-400" />
              Templates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <TemplateCard key={tpl.id} id={tpl.id} name={tpl.name} description={tpl.description} onSelect={handleCreate} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* New CV modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-zinc-100">New CV</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
                <X size={15} />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-5">Choose a template. You can rename your CV after creation.</p>

            <div className="space-y-2 mb-5">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleCreate(tpl.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers size={13} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{tpl.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}