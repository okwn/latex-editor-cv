'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorStore } from '@/lib/resume/editorStore';
import { applyPatch } from '@/lib/resume/jsonPatch';
import { AiPatchPreview } from './AiPatchPreview';
import type { AiResponse } from '@/lib/ai/aiPatchSchema';
import type { Resume } from '@/types/resume';

export type Language = 'turkish' | 'english' | 'mixed';
export type Tone = 'corporate' | 'startup' | 'technical' | 'executive';
export type TargetLength = 'one-page' | 'two-pages' | 'no-preference';

interface JobTailorFormData {
  companyName: string;
  roleTitle: string;
  jobDescription: string;
  language: Language;
  tone: Tone;
  targetLength: TargetLength;
}

const DEFAULT_FORM: JobTailorFormData = {
  companyName: '',
  roleTitle: '',
  jobDescription: '',
  language: 'english',
  tone: 'technical',
  targetLength: 'no-preference',
};

const TONE_PROMPTS: Record<Tone, string> = {
  corporate: 'Use a corporate, formal tone. Emphasize leadership, metrics, and business impact.',
  startup: 'Use a startup-friendly tone. Focus on technical depth, tool-first thinking, and measurable impact.',
  technical: 'Use a highly technical tone. Prioritize specificity, tool names, methodologies, and technical achievements.',
  executive: 'Use an executive tone. Emphasize strategic vision, cross-functional leadership, and organizational impact.',
};

const LANGUAGE_PROMPTS: Record<Language, string> = {
  turkish: 'The CV should be in Turkish.',
  english: 'The CV should be in English.',
  mixed: 'The CV can mix Turkish and English as appropriate.',
};

function buildAnalyzePrompt(form: JobTailorFormData, resumeJson: string): string {
  return `Analyze the following job posting and compare it against the provided CV.

Job Posting:
- Company: ${form.companyName || 'Not specified'}
- Role: ${form.roleTitle || 'Not specified'}
- Description: ${form.jobDescription || 'Not provided'}

Return ONLY a valid JSON object:
{
  "roleCategory": "The category/type of role this represents",
  "keyResponsibilities": ["list of 3-6 key responsibilities from the job description"],
  "requiredSkills": ["skills explicitly mentioned as required or strongly preferred"],
  "preferredSkills": ["skills mentioned as nice-to-have"],
  "missingKeywords": ["important keywords from job description not found in CV"],
  "recommendedEmphasis": ["CV sections or achievements to emphasize for this role"]
}

CV Data:
${resumeJson}`;
}

function buildTailorPrompt(form: JobTailorFormData, resumeJson: string): string {
  return `Tailor the provided CV for the following job posting.

${TONE_PROMPTS[form.tone]}
${LANGUAGE_PROMPTS[form.language]}

Target length: ${form.targetLength === 'one-page' ? 'Fit everything on one page — prioritize highest-impact entries.' : form.targetLength === 'two-pages' ? 'Aim for two pages — include all relevant content.' : 'No strict page limit — prioritize quality over length.'}

Job Posting:
- Company: ${form.companyName || 'Not specified'}
- Role: ${form.roleTitle || 'Not specified'}
- Description: ${form.jobDescription || 'Not provided'}

Rules:
- NEVER fabricate degrees, certifications, or work experience
- You may rephrase existing project descriptions to better match the role's keywords
- You may reorder or remove projects to prioritize relevance
- You may reorder skill groups to surface most relevant skills first
- You may rephrase the professional summary to match the role's language/tone
- Any additions (new skills, projects) must be flagged as warnings

Return ONLY a valid JSON object:
{
  "summary": "Brief explanation of what was changed and why",
  "patches": [
    { "op": "replace" | "add" | "remove" | "move", "path": "/field/path", "value": <new value> }
  ],
  "warnings": ["Any concerns, e.g., 'SUGGESTED: Add Kubernetes to DevOps skills — user should verify'"]
}

CV Data:
${resumeJson}`;
}

function buildKeywordsPrompt(form: JobTailorFormData, resumeJson: string): string {
  return `Extract all important keywords and phrases from the following job posting, then compare against the CV.

Job Posting:
- Company: ${form.companyName || 'Not specified'}
- Role: ${form.roleTitle || 'Not specified'}
- Description: ${form.jobDescription || 'Not provided'}

Return ONLY a valid JSON object:
{
  "foundInCV": ["Keywords from job description that already appear in the CV"],
  "missingFromCV": ["Important keywords from job description that do NOT appear in the CV"],
  "suggestedIntegrations": ["How the missing keywords could be naturally integrated into existing CV entries"]
}

CV Data:
${resumeJson}`;
}

function buildCoverSummaryPrompt(form: JobTailorFormData, resumeJson: string): string {
  return `Generate a tailored professional summary / cover letter opening based on the job posting.

${TONE_PROMPTS[form.tone]}
${LANGUAGE_PROMPTS[form.language]}

Job Posting:
- Company: ${form.companyName || 'Not specified'}
- Role: ${form.roleTitle || 'Not specified'}
- Description: ${form.jobDescription || 'Not provided'}

The summary should:
- Be 3-5 sentences
- Highlight the most relevant experience for this specific role
- Use language and keywords from the job description
- Avoid repeating information already obvious from the CV
- Sound authentic to the candidate's voice

Return ONLY a valid JSON object:
{
  "summary": "The tailored professional summary text",
  "tailoredFor": "The company name and role this summary targets"
}

CV Data:
${resumeJson}`;
}

function buildSkillsPrompt(form: JobTailorFormData, resumeJson: string): string {
  return `Optimize the skill ordering in this CV for the following job posting.

Prioritize skills that:
- Appear in the job description
- Are most relevant to the role's responsibilities
- Are most impressive for the specific company type (startup vs enterprise, etc.)

${LANGUAGE_PROMPTS[form.language]}

Job Posting:
- Company: ${form.companyName || 'Not specified'}
- Role: ${form.roleTitle || 'Not specified'}
- Description: ${form.jobDescription || 'Not provided'}

Rules:
- Only reorder or rephrase existing skills — never add fake ones
- Skills not mentioned in the job description should move to lower priority
- You may split or merge skill groups if appropriate

Return ONLY a valid JSON object:
{
  "summary": "Brief explanation of the skill reordering",
  "patches": [
    { "op": "replace", "path": "/skillGroups", "value": <new skill groups array with reordered skills> }
  ],
  "warnings": []
}

CV Data:
${resumeJson}`;
}

function buildProjectsPrompt(form: JobTailorFormData, resumeJson: string): string {
  return `Optimize project ordering and descriptions for the following job posting.

${TONE_PROMPTS[form.tone]}
${LANGUAGE_PROMPTS[form.language]}

Target length: ${form.targetLength === 'one-page' ? 'Prioritize the 2-3 most relevant projects. Consider removing less relevant ones.' : 'Show all relevant projects, reordered by relevance.'}

Job Posting:
- Company: ${form.companyName || 'Not specified'}
- Role: ${form.roleTitle || 'Not specified'}
- Description: ${form.jobDescription || 'Not provided'}

Rules:
- Reorder projects by relevance to the job posting
- You may rephrase project descriptions to emphasize relevant skills/keywords
- You may remove projects that are not relevant (mark as remove patch)
- NEVER invent project details not present in the original CV
- Never add fake projects

Return ONLY a valid JSON object:
{
  "summary": "Brief explanation of project reordering and changes",
  "patches": [
    { "op": "replace" | "remove" | "move", "path": "/projects/X/description", "value": "<rephrased description>" }
  ],
  "warnings": []
}

CV Data:
${resumeJson}`;
}

type ActionType = 'analyze' | 'tailor' | 'keywords' | 'cover' | 'skills' | 'projects';

interface ActionResult {
  id: string;
  action: ActionType;
  loading: boolean;
  content?: string;
  aiResponse?: AiResponse;
  error?: string;
}

export function JobTailorPanel() {
  const { resumeData, setResumeData, autoCompileAfterAi, generateFromBlocks, compile, compileStatus } = useEditorStore();
  const [form, setForm] = useState<JobTailorFormData>(DEFAULT_FORM);
  const [results, setResults] = useState<ActionResult[]>([]);
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const [previewResponse, setPreviewResponse] = useState<AiResponse | null>(null);
  const [showForm, setShowForm] = useState(true);

  const formRef = useRef(form);
  const _setHasApiKey = useState<boolean | null>(null)[1];

  // Check provider status
  useState(() => {
    fetch('/api/ai')
      .then((res) => res.json())
      .then((data) => _setHasApiKey(data.available))
      .catch(() => _setHasApiKey(false));
  });

  const updateForm = (partial: Partial<JobTailorFormData>) => {
    const next = { ...form, ...partial };
    setForm(next);
    formRef.current = next;
  };

  const callAi = useCallback(async (prompt: string, action: ActionType): Promise<void> => {
    const id = uuid();
    setResults((prev) => [...prev, { id, action, loading: true }]);
    setLoadingAction(action);
    setShowForm(false);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { id: uuid(), role: 'system', content: 'You are KCV AI. Respond with ONLY valid JSON.' },
            { id: uuid(), role: 'user', content: prompt },
          ],
          resumeJson: JSON.stringify(resumeData, null, 2),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.response) {
        throw new Error(data.error || 'AI request failed');
      }

      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const patches = parsed.patches;
          if (patches && Array.isArray(patches) && patches.length > 0) {
            setResults((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, loading: false, aiResponse: parsed, content: parsed.summary || data.response }
                  : r
              )
            );
            return;
          }
        } catch {
          // Fall through to plain text
        }
      }

      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, loading: false, content: data.response }
            : r
        )
      );
    } catch (err) {
      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, loading: false, error: (err as Error).message }
            : r
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }, [resumeData]);

  const handleAnalyze = useCallback(() => {
    callAi(buildAnalyzePrompt(formRef.current, JSON.stringify(resumeData, null, 2)), 'analyze');
  }, [callAi, resumeData]);

  const handleTailor = useCallback(async () => {
    const prompt = buildTailorPrompt(formRef.current, JSON.stringify(resumeData, null, 2));
    const id = uuid();
    setResults((prev) => [...prev, { id, action: 'tailor', loading: true }]);
    setLoadingAction('tailor');
    setShowForm(false);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { id: uuid(), role: 'system', content: 'You are KCV AI. Respond with ONLY valid JSON.' },
            { id: uuid(), role: 'user', content: prompt },
          ],
          resumeJson: JSON.stringify(resumeData, null, 2),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.response) throw new Error(data.error || 'AI request failed');

      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.patches && Array.isArray(parsed.patches) && parsed.patches.length > 0) {
          setResults((prev) =>
            prev.map((r) => r.id === id ? { ...r, loading: false, aiResponse: parsed, content: parsed.summary } : r)
          );
          setPreviewResponse(parsed);
          setLoadingAction(null);
          return;
        }
      }
      throw new Error('Invalid response format — expected JSON patches');
    } catch (err) {
      setResults((prev) =>
        prev.map((r) => r.id === id ? { ...r, loading: false, error: (err as Error).message } : r)
      );
      setLoadingAction(null);
    }
  }, [resumeData]);

  const handleKeywords = useCallback(() => {
    callAi(buildKeywordsPrompt(formRef.current, JSON.stringify(resumeData, null, 2)), 'keywords');
  }, [callAi, resumeData]);

  const handleCoverSummary = useCallback(() => {
    callAi(buildCoverSummaryPrompt(formRef.current, JSON.stringify(resumeData, null, 2)), 'cover');
  }, [callAi, resumeData]);

  const handleOptimizeSkills = useCallback(() => {
    callAi(buildSkillsPrompt(formRef.current, JSON.stringify(resumeData, null, 2)), 'skills');
  }, [callAi, resumeData]);

  const handleOptimizeProjects = useCallback(() => {
    callAi(buildProjectsPrompt(formRef.current, JSON.stringify(resumeData, null, 2)), 'projects');
  }, [callAi, resumeData]);

  const _handleApplyPatches = useCallback((response: AiResponse) => {
    if (!response.patches || response.patches.length === 0) return;
    let current = resumeData as unknown as Record<string, unknown>;
    for (const patch of response.patches) {
      current = applyPatch(current, patch);
    }
    setResumeData(current as unknown as Resume);
    generateFromBlocks();
    if (autoCompileAfterAi && compileStatus !== 'compiling') compile();
    setPreviewResponse(null);
  }, [resumeData, setResumeData, generateFromBlocks, autoCompileAfterAi, compile, compileStatus]);

  const handleDismissPreview = useCallback(() => {
    setPreviewResponse(null);
  }, []);

  const actionLabels: Record<ActionType, string> = {
    analyze: 'Analyze Job',
    tailor: 'Tailor CV',
    keywords: 'Extract Keywords',
    cover: 'Cover Summary',
    skills: 'Optimize Skills',
    projects: 'Optimize Projects',
  };

  const actionColors: Record<ActionType, string> = {
    analyze: 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/50',
    tailor: 'bg-green-600/30 text-green-400 hover:bg-green-600/50',
    keywords: 'bg-purple-600/30 text-purple-400 hover:bg-purple-600/50',
    cover: 'bg-amber-600/30 text-amber-400 hover:bg-amber-600/50',
    skills: 'bg-cyan-600/30 text-cyan-400 hover:bg-cyan-600/50',
    projects: 'bg-orange-600/30 text-orange-400 hover:bg-orange-600/50',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Form toggle */}
      <div className="px-4 py-2 border-b border-zinc-800 flex gap-2">
        <button
          onClick={() => setShowForm(true)}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            showForm ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Job Details
        </button>
        <button
          onClick={() => setShowForm(false)}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            !showForm ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Results
        </button>
      </div>

      {/* Job details form */}
      {showForm && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="text-xs text-zinc-500 mb-1 font-medium">Job Posting</div>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Company name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => updateForm({ companyName: e.target.value })}
                placeholder="e.g., Stripe, Amazon, local startup"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Role title</label>
              <input
                type="text"
                value={form.roleTitle}
                onChange={(e) => updateForm({ roleTitle: e.target.value })}
                placeholder="e.g., Senior DevOps Engineer"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Job description</label>
              <textarea
                value={form.jobDescription}
                onChange={(e) => updateForm({ jobDescription: e.target.value })}
                placeholder="Paste the full job description here..."
                rows={5}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            {/* Language */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Language</label>
              <div className="flex gap-2">
                {(['turkish', 'english', 'mixed'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => updateForm({ language: lang })}
                    className={`text-xs px-2.5 py-1 rounded capitalize transition-colors ${
                      form.language === lang
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {(['corporate', 'startup', 'technical', 'executive'] as Tone[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateForm({ tone: t })}
                    className={`text-xs px-2.5 py-1 rounded capitalize transition-colors ${
                      form.tone === t
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Target length */}
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Target length</label>
              <div className="flex gap-2">
                {(['one-page', 'two-pages', 'no-preference'] as TargetLength[]).map((len) => (
                  <button
                    key={len}
                    onClick={() => updateForm({ targetLength: len })}
                    className={`text-xs px-2.5 py-1 rounded capitalize transition-colors ${
                      form.targetLength === len
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    {len.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-zinc-800/50">
            <div className="text-xs text-zinc-500 mb-2 font-medium">Actions</div>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { action: 'analyze' as ActionType, label: 'Analyze Job' },
                { action: 'tailor' as ActionType, label: 'Tailor CV' },
                { action: 'keywords' as ActionType, label: 'Extract Keywords' },
                { action: 'cover' as ActionType, label: 'Cover Summary' },
                { action: 'skills' as ActionType, label: 'Optimize Skills' },
                { action: 'projects' as ActionType, label: 'Optimize Projects' },
              ]).map(({ action, label }) => (
                <button
                  key={action}
                  onClick={() => {
                    if (action === 'analyze') handleAnalyze();
                    else if (action === 'tailor') handleTailor();
                    else if (action === 'keywords') handleKeywords();
                    else if (action === 'cover') handleCoverSummary();
                    else if (action === 'skills') handleOptimizeSkills();
                    else if (action === 'projects') handleOptimizeProjects();
                  }}
                  disabled={loadingAction !== null}
                  className={`text-xs px-2.5 py-2 rounded ${actionColors[action]} disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left font-medium ${
                    action === 'tailor' ? 'col-span-2' : ''
                  }`}
                >
                  {loadingAction === action ? '...' : label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results panel */}
      {!showForm && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mb-2"
          >
            ← Back to form
          </button>

          {results.length === 0 && (
            <div className="text-xs text-zinc-500 text-center py-8">
              No results yet. Fill in the job details and run an action.
            </div>
          )}

          {results.map((result) => (
            <div key={result.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  result.loading ? 'bg-zinc-700 text-zinc-400' : actionColors[result.action]
                }`}>
                  {actionLabels[result.action]}
                </span>
                {result.loading && (
                  <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                )}
              </div>

              {result.error && (
                <div className="text-xs text-red-400 p-2 rounded bg-red-500/10 border border-red-500/20">
                  {result.error}
                </div>
              )}

              {result.aiResponse && (
                <div className="mt-1">
                  <div className="text-xs text-green-400 mb-1">
                    {result.aiResponse.patches.length} suggested changes
                  </div>
                  <button
                    onClick={() => setPreviewResponse(result.aiResponse!)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    Review changes →
                  </button>
                </div>
              )}

              {result.content && !result.error && (
                <div className="text-xs text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">
                  {result.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Patch preview modal */}
      {previewResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="text-sm font-medium text-amber-400">Review CV Changes</div>
              <button
                onClick={handleDismissPreview}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 text-lg"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <AiPatchPreview
                response={previewResponse}
                onDismiss={handleDismissPreview}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
