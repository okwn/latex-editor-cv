/**
 * KCV Modern LaTeX CV Template
 *
 * Package requirements:
 * - article document class
 * - geometry (margin 0.65in)
 * - titlesec (section styling)
 * - enumitem (lists)
 * - hyperref (links)
 * - xcolor (colors)
 * - multicol (multi-column layouts)
 * - tabularx (tables)
 * - array (table extensions)
 * - parskip (paragraph spacing)
 * - fontawesome5 (icons)
 * - ragged2e (text alignment)
 * - tcolorbox (boxes)
 * - setspace (line spacing)
 * - etoolbox
 *
 * Color palette:
 * - primary: #111827
 * - secondary: #374151
 * - accent: #2563EB
 * - lightgray: #E5E7EB
 * - soft: #F8FAFC
 */

import type { Resume } from '@/types/resume';
import type { Template } from './templateRegistry';
import { registerTemplate } from './templateRegistry';
import { escapeLatex, escapeLatexForUrl } from '@/lib/latex/escapeLatex';
import type {
  ResumeLayout,
  BlockConfig,
  BlockType,
  HeaderSettings,
  SummarySettings,
  EducationSettings,
  SkillsSettings,
  ProjectSettings,
  CertificationSettings,
} from '@/types/blockLayout';
import { BLOCK_DEFINITIONS } from '@/types/blockLayout';

interface BlockVisibility {
  header: boolean;
  summary: boolean;
  education: boolean;
  skills: boolean;
  projects: boolean;
  focusAreas: boolean;
  certifications: boolean;
  customText: boolean;
  languages: boolean;
  awards: boolean;
  links: boolean;
  experience: boolean;
  publications: boolean;
  tools: boolean;
  softSkills: boolean;
  courses: boolean;
  openSource: boolean;
  interests: boolean;
  volunteer: boolean;
  patents: boolean;
  talks: boolean;
  caseStudies: boolean;
  references: boolean;
}

export interface KcvTemplateConfig {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorLightGray: string;
  colorSoft: string;
  marginInch: string;
}

export const defaultTemplateConfig: KcvTemplateConfig = {
  colorPrimary: '111827',
  colorSecondary: '374151',
  colorAccent: '2563EB',
  colorLightGray: 'E5E7EB',
  colorSoft: 'F8FAFC',
  marginInch: '0.65',
};

export const kcvTemplatePreamble = (config: KcvTemplateConfig = defaultTemplateConfig) => `\\usepackage[margin=${config.marginInch}in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{multicol}
\\usepackage{tabularx}
\\usepackage{array}
\\usepackage{parskip}
\\usepackage{fontawesome5}
\\usepackage{ragged2e}
\\usepackage{tcolorbox}
\\usepackage{setspace}
\\usepackage{etoolbox}

% Color definitions
\\definecolor{kcvprimary}{HTML}{${config.colorPrimary}}
\\definecolor{kcvsecondary}{HTML}{${config.colorSecondary}}
\\definecolor{kcvaccent}{HTML}{${config.colorAccent}}
\\definecolor{kcvlightgray}{HTML}{${config.colorLightGray}}
\\definecolor{kcvsoft}{HTML}{${config.colorSoft}}

% hyperlinks setup
\\hypersetup{
  colorlinks=true,
  linkcolor=kcvaccent,
  urlcolor=kcvaccent,
  filecolor=kcvaccent,
  citecolor=kcvaccent,
}

% Section styling with horizontal rule
\\titleformat{\\section}{\\Large\\bfseries\\color{kcvprimary}}{}{0em}{
  \\vspace{-0.3em}
  \\hrule height 1pt
  \\vspace{0.2em}
}
\\titlespacing*{\\section}{0pt}{0.6em}{0.4em}

% Name command
\\newcommand{\\cvname}[2][\LARGE]{\\textbf{#1\\color{kcvprimary}{#2}}\\\\[0.3em]}

% Role command
\\newcommand{\\cvrole}[1]{\\textit{\\large\\color{kcvsecondary}{#1}}\\\\[0.8em]}

% Contact item: icon + label + value
% Use \csname fa#1\endcsname to construct the icon command dynamically
\\newcommand{\\contactitem}[3]{\\csname fa#1\\endcsname\\hspace{0.4em}\\textbf{#2}\\hspace{0.5em}#3\\\\}

% Education item: degree | years | institution | city
\\newcommand{\\eduitem}[4]{\\textbf{#1} & \\textit{#4} & #2--#3\\\\}

% Skill group: category label + comma-separated skills
\\newcommand{\\skillgroup}[2]{\\textbf{\\color{kcvaccent}{#1:}}\\hspace{0.3em}#2\\\\[0.3em]}

% Itemize settings
\\setlist[itemize]{leftmargin=1.2em, itemsep=0.2em}
\\setlist[enumerate]{leftmargin=1.2em, itemsep=0.2em}

% No paragraph indent
\\setlength{\\parindent}{0pt}`;

function getBlockVisibility(layout: ResumeLayout | undefined): BlockVisibility {
  const defaults: BlockVisibility = {
    header: true,
    summary: true,
    education: true,
    skills: true,
    projects: true,
    focusAreas: true,
    certifications: true,
    customText: true,
    languages: true,
    awards: true,
    links: true,
    experience: true,
    publications: true,
    tools: true,
    softSkills: true,
    courses: true,
    openSource: true,
    interests: true,
    volunteer: true,
    patents: true,
    talks: true,
    caseStudies: true,
    references: true,
  };
  if (!layout?.blocks) return defaults;
  const result = { ...defaults };
  for (const block of layout.blocks) {
    const key = block.type as BlockType;
    if (key in result) result[key] = block.active;
  }
  return result;
}

function getHeaderSettings(layout: ResumeLayout | undefined): HeaderSettings {
  const defaults: HeaderSettings = {
    alignment: 'center',
    showPhone: true,
    showEmail: true,
    showGithub: true,
    showLinkedin: true,
    showWebsite: true,
    showLocation: false,
    contactLayout: 'inline',
    nameSize: 'normal',
  };
  if (!layout?.blocks) return defaults;
  const block = layout.blocks.find((b) => b.type === 'header');
  return block ? ({ ...defaults, ...block.settings } as HeaderSettings) : defaults;
}

function getProjectSettings(layout: ResumeLayout | undefined): ProjectSettings {
  const defaults: ProjectSettings = {
    columns: 2, cardSize: 'normal', showLinks: true, showTags: true, maxProjects: undefined, spacing: 'normal',
  };
  if (!layout?.blocks) return defaults;
  const block = layout.blocks.find((b) => b.type === 'projects');
  return block ? ({ ...defaults, ...block.settings } as ProjectSettings) : defaults;
}

function getEducationSettings(layout: ResumeLayout | undefined): EducationSettings {
  const defaults: EducationSettings = { columns: 2, spacing: 'normal' };
  if (!layout?.blocks) return defaults;
  const block = layout.blocks.find((b) => b.type === 'education');
  return block ? ({ ...defaults, ...block.settings } as EducationSettings) : defaults;
}

function getSkillsSettings(layout: ResumeLayout | undefined): SkillsSettings {
  const defaults: SkillsSettings = { style: 'grouped-lines', columns: 2, spacing: 'normal' };
  if (!layout?.blocks) return defaults;
  const block = layout.blocks.find((b) => b.type === 'skills');
  return block ? ({ ...defaults, ...block.settings } as SkillsSettings) : defaults;
}

function getCertSettings(layout: ResumeLayout | undefined): CertificationSettings {
  const defaults: CertificationSettings = { columns: 3, spacing: 'normal' };
  if (!layout?.blocks) return defaults;
  const block = layout.blocks.find((b) => b.type === 'certifications');
  return block ? ({ ...defaults, ...block.settings } as CertificationSettings) : defaults;
}

function getSummarySettings(layout: ResumeLayout | undefined): SummarySettings {
  const defaults: SummarySettings = { alignment: 'left', spacing: 'normal' };
  if (!layout?.blocks) return defaults;
  const block = layout.blocks.find((b) => b.type === 'summary');
  return block ? ({ ...defaults, ...block.settings } as SummarySettings) : defaults;
}

function spacingValue(spacing: 'compact' | 'normal' | 'relaxed', base: string, factor: number): string {
  // For itemsep/vspace: compact = base * 0.5, normal = base, relaxed = base * 1.5
  if (spacing === 'compact') return `${(parseFloat(base) * 0.5).toFixed(1)}em`;
  if (spacing === 'relaxed') return `${(parseFloat(base) * 1.5).toFixed(1)}em`;
  return base;
}

interface RenderData {
  name: string;
  role: string;
  email: string;
  github: string;
  linkedin: string;
  website: string;
  phone: string;
  location: string;
  summaryText: string;
  eduItems: { degree: string; institution: string; city: string; startYear: string; endYear: string; status: string }[];
  skillItems: { groupName: string; skills: string[] }[];
  displayProjects: { title: string; yearRange: string; linkLabel: string; linkUrl: string; description: string; tags: string[]; priority: string }[];
  focusItems: string[];
  certItems: string[];
}

function renderBlockSection(
  block: BlockConfig,
  vis: BlockVisibility,
  hs: HeaderSettings,
  ss: SummarySettings,
  es: EducationSettings,
  sk: SkillsSettings,
  ps: ProjectSettings,
  cs: CertificationSettings,
  data: RenderData
): string {
  const type = block.type;
  const activeKey = type as keyof BlockVisibility;
  if (!vis[activeKey]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[KCV] renderBlockSection SKIP ${type}: vis=${vis[activeKey]}`);
    }
    return '';
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[KCV] renderBlockSection RENDER ${type}`);
  }

  switch (type) {
    case 'header': {
      const alignEnv = hs.alignment === 'left' ? '\\begin{flushleft}' : hs.alignment === 'right' ? '\\begin{flushright}' : '\\begin{center}';
      const alignEnd = hs.alignment === 'left' ? '\\end{flushleft}' : hs.alignment === 'right' ? '\\end{flushright}' : '\\end{center}';
      const nameSize = hs.nameSize === 'large' ? '\\Large' : hs.nameSize === 'compact' ? '\\large' : '\\LARGE';

      // Build list of contact items to render
      type ContactItem = { icon: string; label: string; value: string };
      const contacts: ContactItem[] = [];
      if (hs.showEmail && data.email) contacts.push({ icon: 'Envelope', label: 'Email', value: data.email });
      if (hs.showGithub && data.github) contacts.push({ icon: 'Github', label: 'GitHub', value: data.github });
      if (hs.showLinkedin && data.linkedin) contacts.push({ icon: 'Linkedin', label: 'LinkedIn', value: data.linkedin });
      if (hs.showWebsite && data.website) contacts.push({ icon: 'Globe', label: 'Web', value: data.website });
      if (hs.showPhone && data.phone) contacts.push({ icon: 'Phone', label: 'Tel', value: data.phone });
      if (hs.showLocation && (data as unknown as { location?: string }).location) contacts.push({ icon: 'MapMarker', label: 'Loc', value: (data as unknown as { location?: string }).location ?? '' });

      let tex = `${alignEnv}\n\\cvname{${nameSize}}{${data.name}}\n\\cvrole{${data.role}}\n`;

      if (contacts.length > 0) {
        if (hs.contactLayout === 'stacked') {
          tex += '\\begin{tabular}{l}\n';
          for (const c of contacts) {
            const url = c.icon === 'Envelope' ? `mailto:${c.value}` :
                        c.icon === 'Phone' ? `tel:${c.value.replace(/\s/g, '')}` :
                        c.value;
            tex += `\\contactitem{${c.icon}}{${c.label}}{\\href{${url}}{${c.value}}}\n`;
          }
          tex += '\\end{tabular}\n';
        } else {
          // Inline: single line with \quad separators
          tex += '{\\small\\raggedright\n';
          for (let i = 0; i < contacts.length; i++) {
            const c = contacts[i];
            const url = c.icon === 'Envelope' ? `mailto:${c.value}` :
                        c.icon === 'Phone' ? `tel:${c.value.replace(/\s/g, '')}` :
                        c.value;
            tex += `\\fa${c.icon}\\ \\href{${url}}{${c.value}}`;
            if (i < contacts.length - 1) {
              tex += ' \\quad';
            }
          }
          tex += '\n}\n';
        }
      }

      tex += `\\vspace{1em}\n${alignEnd}\n\n`;
      return tex;
    }
    case 'summary': {
      const alignCmd = ss.alignment === 'justified' ? '\\justifying' : '';
      return `% KCV-BLOCK: summary\n\\section{Summary}\n${alignCmd}${data.summaryText}\n\n`;
    }
    case 'education': {
      if (!data.eduItems.length) return '';
      const eduVspace = spacingValue(es.spacing, '0.4em', 0);
      let tex = `% KCV-BLOCK: education\n\\section{Education}\n`;
      if (es.columns === 2) tex += `\\begin{multicols}{2}\\raggedcolumns\n`;
      for (const edu of data.eduItems) {
        tex += `\\vspace{${eduVspace}}\n\\textbf{${edu.degree}} \\hfill ${edu.startYear}--${edu.endYear}${edu.status ? ` (${edu.status})` : ''}\n\\\\\n\\textit{${edu.institution}}${edu.city ? `, ${edu.city}` : ''}\n\\\\\n`;
      }
      if (es.columns === 2) tex += '\\end{multicols}\n';
      tex += '\\vspace{0.5em}\n\n';
      return tex;
    }
    case 'skills': {
      if (!data.skillItems.length) return '';
      const skillVspace = spacingValue(sk.spacing, '0.3em', 0);
      const useCols = sk.columns > 1 && sk.style !== 'chips';
      let tex = `% KCV-BLOCK: skills\n\\section{Skills}\n`;
      if (useCols) tex += `\\begin{multicols{${sk.columns}}\\raggedcolumns\n`;
      if (sk.style === 'chips') {
        for (const group of data.skillItems) {
          tex += `\\textbf{\\color{kcvaccent}${group.groupName}:}\\ `;
          tex += `\\foreach \\x in {${group.skills.join(',')}}{`;
          tex += `\\ tcolorbox[colback=kcvsoft, colframe=kcvlightgray, arc=2pt, boxsep=2pt]{\\x}`;
          tex += `}\\ \\n`;
        }
      } else if (sk.style === 'compact') {
        for (const group of data.skillItems) {
          tex += `\\skillgroup{${group.groupName}}{${group.skills.join(', ')}}\n`;
          tex += `\\vspace{${skillVspace}}\n`;
        }
      } else {
        for (const group of data.skillItems) {
          tex += `\\skillgroup{${group.groupName}}{${group.skills.join(', ')}}\n`;
        }
        tex += '\\vspace{0.5em}\n';
      }
      if (useCols) tex += '\\end{multicols}\n';
      return tex;
    }
    case 'projects': {
      if (!data.displayProjects.length) return '';
      const projVspace = spacingValue(ps.spacing, '0.5em', 0);
      const boxSep = ps.cardSize === 'compact' ? '2pt' : ps.cardSize === 'large' ? '8pt' : '4pt';
      let tex = `% KCV-BLOCK: projects\n\\section{Projects}\n`;
      if (ps.columns > 1) tex += `\\begin{multicols{${ps.columns}}\\raggedcolumns\n`;
      for (const proj of data.displayProjects) {
        const linkPart = ps.showLinks && proj.linkUrl
          ? `\\href{${proj.linkUrl}}{${proj.linkLabel}}`
          : escapeLatex(proj.linkLabel);
        const tagsPart = ps.showTags && proj.tags.length > 0 ? `\\\\[${projVspace}]\\textit{${proj.tags.join(', ')}}` : '';
        tex += `\\begin{tcolorbox}[colback=kcvsoft, colframe=kcvlightgray, arc=4pt, boxsep=${boxSep}]\n\\textbf{${proj.title}} \\hfill ${proj.yearRange}\n\\\\\n${linkPart}\n\\\\\n\\textit{${proj.description}}${tagsPart}\n\\end{tcolorbox}\n\\vspace{${projVspace}}\n`;
      }
      if (ps.columns > 1) tex += '\\end{multicols}\n';
      tex += '\\vspace{0.5em}\n\n';
      return tex;
    }
    case 'focusAreas': {
      if (!data.focusItems.length) return '';
      let tex = `% KCV-BLOCK: focusAreas\n\\section{Focus Areas}\n\\begin{itemize}\n`;
      for (const area of data.focusItems) {
        tex += `\\item ${area}\n`;
      }
      tex += '\\end{itemize}\n\\vspace{0.5em}\n\n';
      return tex;
    }
    case 'certifications': {
      if (!data.certItems.length) return '';
      let tex = `% KCV-BLOCK: certifications\n\\section{Certifications}\n`;
      if (cs.columns > 1) tex += `\\begin{multicols}{${cs.columns}}\\raggedcolumns\n`;
      tex += '\\begin{itemize}\n';
      for (const cert of data.certItems) {
        tex += `\\item ${cert}\n`;
      }
      tex += '\\end{itemize}\n';
      if (cs.columns > 1) tex += '\\end{multicols}\n';
      tex += '\\vspace{0.5em}\n\n';
      return tex;
    }
    default:
      return '';
  }
}

function renderKcvModern(resume: Resume): string {
  const { personal, summary, education, skillGroups, projects, focusAreas, certifications, resumeLayout } = resume;
  const vis = getBlockVisibility(resumeLayout);
  const hs = getHeaderSettings(resumeLayout);
  const ss = getSummarySettings(resumeLayout);
  const es = getEducationSettings(resumeLayout);
  const sk = getSkillsSettings(resumeLayout);
  const ps = getProjectSettings(resumeLayout);
  const cs = getCertSettings(resumeLayout);

  const name = escapeLatex(personal.fullName);
  const role = escapeLatex(personal.role);
  const email = escapeLatex(personal.email);
  const github = escapeLatex(personal.github);
  const linkedin = personal.linkedin ? escapeLatex(personal.linkedin) : '';
  const website = personal.website ? escapeLatex(personal.website) : '';
  const phone = personal.phone ? escapeLatex(personal.phone) : '';

  const summaryText = escapeLatex(summary.professionalSummary);

  const eduItems = education.map((edu) => ({
    degree: escapeLatex(edu.degree),
    institution: escapeLatex(edu.institution),
    city: escapeLatex(edu.city),
    startYear: escapeLatex(edu.startYear),
    endYear: escapeLatex(edu.endYear),
    status: edu.status ? escapeLatex(edu.status) : '',
  }));

  const skillItems = skillGroups.map((g) => ({
    groupName: escapeLatex(g.groupName),
    skills: g.skills.map((s) => escapeLatex(s)),
  }));

  let displayProjects = projects.map((p) => ({
    title: escapeLatex(p.title),
    yearRange: escapeLatex(p.yearRange),
    linkLabel: escapeLatex(p.linkLabel),
    linkUrl: p.linkUrl ? escapeLatexForUrl(p.linkUrl) : '',
    description: escapeLatex(p.description),
    tags: p.tags ? p.tags.map((t) => escapeLatex(t)) : [],
    priority: p.priority || '',
  }));
  if (ps.maxProjects != null && ps.maxProjects > 0) {
    displayProjects = displayProjects.slice(0, ps.maxProjects);
  }

  const focusItems = focusAreas.map((a) => escapeLatex(a));
  const certItems = certifications.map((c) => escapeLatex(c));

  const preamble = kcvTemplatePreamble(defaultTemplateConfig);

  const sortedBlocks = [...(resumeLayout?.blocks ?? [])].sort((a, b) => a.order - b.order);

  if (process.env.NODE_ENV === 'development') {
    const activeSorted = sortedBlocks.filter((b) => b.active);
    console.log('[KCV] active blocks before render:', activeSorted.map((b) => b.type).join(', '));
    console.log('[KCV] renderCustomBlocks: customBlocks=', (resume.customBlocks || []).map((b) => `${b.type}[${b.id.slice(0, 8)}]`).join(', '));
    console.log('[KCV] renderCustomBlocks: customBlocksOrder=', (resumeLayout?.customBlocksOrder || []).map((id) => id.slice(0, 8)).join(', '));
  }

  const data: RenderData = {
    name,
    role,
    email,
    github,
    linkedin,
    website,
    phone,
    location: personal.location ? escapeLatex(personal.location) : '',
    summaryText,
    eduItems,
    skillItems,
    displayProjects,
    focusItems,
    certItems,
  };

  let tex = `\\documentclass[11pt,a4paper]{article}
${preamble}

\\begin{document}
\\raggedright
\\setstretch{1.1}
`;

  for (const block of sortedBlocks) {
    const rendered = renderBlockSection(block, vis, hs, ss, es, sk, ps, cs, data);
    if (rendered) tex += rendered;
  }

  const sectionsBeforeCustom = (tex.match(/\\section\{/g) || []).map((s) => s.replace('\\section{', '').replace('}', ''));
  console.log('[KCV] generated LaTeX sections (before custom):', sectionsBeforeCustom.join(', '));

  tex += `\\end{document}`;
  tex = renderCustomBlocks(tex, resume);
  return tex;
}

function renderCustomBlocks(tex: string, resume: Resume): string {
  if (process.env.NODE_ENV === 'development') {
    console.log('[KCV] renderCustomBlocks called');
  }
  const order = resume.resumeLayout?.customBlocksOrder || [];
  const blocks = resume.customBlocks || [];
  const ordered = [...blocks].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  for (const cb of ordered) {
    const blockTitle = escapeLatex(cb.title);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[KCV] renderCustomBlock ${cb.type}: "${cb.title}" id=${cb.id.slice(0, 8)}`);
    }

    if (cb.type === 'customText') {
      const paragraphs = (cb as { paragraphs: string[] }).paragraphs.filter((p) => p.trim());
      if (!paragraphs.length) continue;
      tex += `% KCV-BLOCK: customText\n${cb.id}
\\section{${blockTitle}}
`;
      for (const p of paragraphs) {
        tex += `${escapeLatex(p)}\n\n`;
      }
    } else if (cb.type === 'languages') {
      const items = (cb as { items: { language: string; proficiency?: string }[] }).items.filter((i) => i.language.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: languages SKIP - no items with language`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: languages RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: languages\n${cb.id}
\\section{${blockTitle}}
\\begin{multicols}{2}\\raggedcolumns
\\begin{itemize}
`;
      for (const item of items) {
        const prof = item.proficiency ? ` (${escapeLatex(item.proficiency)})` : '';
        tex += `\\item ${escapeLatex(item.language)}${prof}\n`;
      }
      tex += `\\end{itemize}
\\end{multicols}
\\vspace{0.5em}

`;
    } else if (cb.type === 'awards') {
      const items = (cb as { items: { title: string; issuer?: string; year?: string }[] }).items.filter((i) => i.title.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: awards SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: awards RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: awards\n${cb.id}
\\section{${blockTitle}}
`;
      for (const item of items) {
        tex += `\\vspace{0.3em}\\textbf{${escapeLatex(item.title)}}${item.year ? ` \\hfill ${escapeLatex(item.year)}` : ''}\n`;
        if (item.issuer) tex += `\\textit{${escapeLatex(item.issuer)}}\\\\\n`;
        else tex += `\\\\\n`;
      }
      tex += `\\vspace{0.5em}

`;
    } else if (cb.type === 'links') {
      const items = (cb as { items: { label: string; url: string }[] }).items.filter((i) => i.url.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: links SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: links RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: links\n${cb.id}
\\section{${blockTitle}}
\\begin{itemize}
`;
      for (const item of items) {
        const label = escapeLatex(item.label || item.url);
        const url = escapeLatexForUrl(item.url);
        tex += `\\item \\href{${url}}{${label}}\n`;
      }
      tex += `\\end{itemize}
\\vspace{0.5em}

`;
    } else if (cb.type === 'tools') {
      const items = (cb as { items: string[] }).items.filter((i) => i.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: tools SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: tools RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: tools\n${cb.id}
\\section{${blockTitle}}
\\begin{multicols}{2}\\raggedcolumns
\\begin{itemize}
`;
      for (const item of items) {
        tex += `\\item ${escapeLatex(item)}\n`;
      }
      tex += `\\end{itemize}
\\end{multicols}
\\vspace{0.5em}

`;
    } else if (cb.type === 'softSkills') {
      const items = (cb as { items: string[] }).items.filter((i) => i.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: softSkills SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: softSkills RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: softSkills\n${cb.id}
\\section{${blockTitle}}
\\begin{multicols}{2}\\raggedcolumns
\\begin{itemize}
`;
      for (const item of items) {
        tex += `\\item ${escapeLatex(item)}\n`;
      }
      tex += `\\end{itemize}
\\end{multicols}
\\vspace{0.5em}

`;
    } else if (cb.type === 'courses') {
      const items = (cb as { items: { name: string; issuer?: string; year?: string; url?: string }[] }).items.filter((i) => i.name.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: courses SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: courses RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: courses\n${cb.id}
\\section{${blockTitle}}
`;
      for (const item of items) {
        tex += `\\vspace{0.25em}\\textbf{${escapeLatex(item.name)}}`;
        if (item.year) tex += ` \\hfill ${escapeLatex(item.year)}`;
        tex += `\\\\\n`;
        if (item.issuer) tex += `\\textit{${escapeLatex(item.issuer)}}\\\\\n`;
        else tex += `\\\\\n`;
      }
      tex += `\\vspace{0.5em}

`;
    } else if (cb.type === 'openSource') {
      const items = (cb as { items: { name: string; description?: string; url?: string; stars?: string }[] }).items.filter((i) => i.name.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: openSource SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: openSource RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: openSource\n${cb.id}
\\section{${blockTitle}}
`;
      for (const item of items) {
        tex += `\\vspace{0.25em}\\textbf{${escapeLatex(item.name)}}`;
        if (item.stars) tex += ` \\hfill \\texttt{${escapeLatex(item.stars)} stars}`;
        tex += `\\\\\n`;
        if (item.description) tex += `\\textit{${escapeLatex(item.description)}}\\\\\n`;
        if (item.url) tex += `\\href{${escapeLatexForUrl(item.url)}}{${escapeLatex(item.url)}}\\\\\n`;
        else tex += `\\\\\n`;
      }
      tex += `\\vspace{0.5em}

`;
    } else if (cb.type === 'interests') {
      const items = (cb as { items: string[] }).items.filter((i) => i.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: interests SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: interests RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: interests\n${cb.id}
\\section{${blockTitle}}
\\begin{multicols}{2}\\raggedcolumns
\\begin{itemize}
`;
      for (const item of items) {
        tex += `\\item ${escapeLatex(item)}\n`;
      }
      tex += `\\end{itemize}
\\end{multicols}
\\vspace{0.5em}

`;
    } else if (cb.type === 'experience') {
      const items = (cb as { items: { role: string; company: string; period: string; description: string }[] }).items.filter((i) => i.role.trim() || i.company.trim());
      if (!items.length) { if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: experience SKIP - no items`); continue; }
      if (process.env.NODE_ENV === 'development') console.log(`[KCV] renderCustomBlock: experience RENDER ${items.length} items`);
      tex += `% KCV-BLOCK: experience\n${cb.id}
\\section{${blockTitle}}
`;
      for (const item of items) {
        tex += `\\vspace{0.3em}\\textbf{${escapeLatex(item.role)}} \\hfill ${escapeLatex(item.period)}\\\\\n`;
        tex += `\\textit{${escapeLatex(item.company)}}\\\\\n`;
        if (item.description) tex += `${escapeLatex(item.description)}\\\\\n`;
        tex += `\\vspace{0.3em}\n`;
      }
      tex += `\\vspace{0.5em}

`;
    }
  }
  return tex;
}

const kcvModernTemplate: Template = {
  id: 'kcv-modern',
  name: 'KCV Modern LaTeX',
  description: 'Clean, professional two-column CV with tcolorbox project cards and horizontal section rules.',
  render: renderKcvModern,
  supports: {
    projects: true,
    certifications: true,
    focusAreas: true,
    twoColumnProjects: true,
    twoColumnEducation: true,
  },
};

registerTemplate(kcvModernTemplate);