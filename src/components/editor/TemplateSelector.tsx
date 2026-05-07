'use client';

import { useEditorStore } from '@/lib/resume/editorStore';
import { TEMPLATES, DEFAULT_TEMPLATE_ID, type Template } from '@/lib/templates/templateRegistry';
// Import kcvModernTemplate to trigger its registerTemplate() side-effect
import '@/lib/templates/kcvModernTemplate';

export function TemplateSelector() {
  const { currentTemplateId, setCurrentTemplateId } = useEditorStore();

  // Defensive: if currentTemplateId is somehow not in TEMPLATES, use DEFAULT_TEMPLATE_ID
  const activeId = TEMPLATES.some((t) => t.id === currentTemplateId)
    ? currentTemplateId
    : DEFAULT_TEMPLATE_ID;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-zinc-500 mb-2">Available Templates</div>
        {TEMPLATES.length === 0 ? (
          <div className="text-xs text-amber-400/70 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            No templates registered — check template registry configuration.
          </div>
        ) : (
          <div className="space-y-2">
            {TEMPLATES.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isActive={activeId === tpl.id}
                onSelect={() => setCurrentTemplateId(tpl.id)}
              />
            ))}
          </div>
        )}
        <AddTemplateCard />
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isActive,
  onSelect,
}: {
  template: Template;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isActive
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{template.name}</span>
        {isActive && (
          <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded text-amber-400">
            Active
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{template.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {template.supports.projects && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">Projects</span>
        )}
        {template.supports.certifications && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">Certs</span>
        )}
        {template.supports.focusAreas && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">Focus</span>
        )}
        {template.supports.twoColumnProjects && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">2-col</span>
        )}
      </div>
    </button>
  );
}

function AddTemplateCard() {
  return (
    <div className="p-3 rounded-lg border border-dashed border-zinc-700 text-zinc-500">
      <div className="text-xs font-medium text-zinc-400 mb-1">Add Template Later</div>
      <p className="text-xs leading-relaxed">
        To add a new template, create a file in{' '}
        <code className="text-amber-400/70">src/lib/templates/</code> following the template
        interface, then register it via{' '}
        <code className="text-amber-400/70">registerTemplate()</code>.
      </p>
      <div className="mt-2 text-xs bg-zinc-800/60 rounded p-2 font-mono text-zinc-500">
        <div>
          <span className="text-zinc-600">1.</span> create <span className="text-amber-400/70">myTemplate.ts</span>
        </div>
        <div>
          <span className="text-zinc-600">2.</span> define <span className="text-green-400/70">Template</span> object
        </div>
        <div>
          <span className="text-zinc-600">3.</span> call <span className="text-blue-400/70">registerTemplate(tpl)</span>
        </div>
      </div>
    </div>
  );
}
