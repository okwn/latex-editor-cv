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
  BlockType,
  HeaderSettings,
  SummarySettings,
  EducationSettings,
  SkillsSettings,
  ProjectSettings,
  CertificationSettings,
} from '@/types/blockLayout';

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
  const location = personal.location ? escapeLatex(personal.location) : '';
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

  let tex = `\\documentclass[11pt,a4paper]{article}
${preamble}

\\begin{document}
\\raggedright
\\setstretch{1.1}
`;

  if (vis.header) {
    const alignEnv = hs.alignment === 'left' ? '\\begin{flushleft}' : hs.alignment === 'right' ? '\\begin{flushright}' : '';
    const alignEnd = hs.alignment === 'left' ? '\\end{flushleft}' : hs.alignment === 'right' ? '\\end{flushright}' : '';
    const nameSize = hs.nameSize === 'large' ? '\\Large' : hs.nameSize === 'compact' ? '\\large' : '\\LARGE';

    tex += `% KCV-BLOCK: header
${alignEnv}
\\cvname{${nameSize}}{${name}}
\\cvrole{${role}}

\\begin{tabular}{l}
`;
    if (hs.showEmail) tex += `\\contactitem{Envelope}{Email}{${email}}\n`;
    if (hs.showGithub) tex += `\\contactitem{Github}{GitHub}{${github}}\n`;
    if (hs.showLinkedin && linkedin) tex += `\\contactitem{Linkedin}{LinkedIn}{${linkedin}}\n`;
    if (hs.showWebsite && website) tex += `\\contactitem{Globe}{Web}{${website}}\n`;
    if (hs.showPhone && phone) tex += `\\contactitem{Phone}{Tel}{${phone}}\n`;
    tex += `\\end{tabular}
\\vspace{1em}
${alignEnd}

`;
  }

  if (vis.summary && summaryText.trim()) {
    const alignCmd = ss.alignment === 'justified' ? '\\justifying' : '';
    tex += `% KCV-BLOCK: summary
\\section{Summary}
${alignCmd}${summaryText}

`;
  }

  if (vis.education && eduItems.length > 0) {
    const eduVspace = spacingValue(es.spacing, '0.4em', 0);
    tex += `% KCV-BLOCK: education
\\section{Education}
`;
    if (es.columns === 2) tex += '\\begin{multicols}{2}\\raggedcolumns\n';
    for (const edu of eduItems) {
      tex += `\\vspace{${eduVspace}}
\\textbf{${edu.degree}} \\hfill ${edu.startYear}--${edu.endYear}${edu.status ? ` (${edu.status})` : ''}
\\\\
\\textit{${edu.institution}}${edu.city ? `, ${edu.city}` : ''}
\\\\
`;
    }
    if (es.columns === 2) tex += '\\end{multicols}\n';
    tex += `\\vspace{0.5em}

`;
  }

  if (vis.skills && skillItems.length > 0) {
    const skVspace = spacingValue(sk.spacing, '0.3em', 0);
    tex += `% KCV-BLOCK: skills
\\section{Skills}
`;
    for (const group of skillItems) {
      tex += `\\skillgroup{${group.groupName}}{${group.skills.join(', ')}}\n`;
    }
    tex += `\\vspace{0.5em}

`;
  }

  if (vis.projects && displayProjects.length > 0) {
    const projVspace = spacingValue(ps.spacing, '0.5em', 0);
    const boxSep = ps.cardSize === 'compact' ? '2pt' : ps.cardSize === 'large' ? '8pt' : '4pt';
    const fontSize = ps.cardSize === 'compact' ? '\\small' : ps.cardSize === 'large' ? '' : '';
    tex += `% KCV-BLOCK: projects
\\section{Projects}
`;
    if (ps.columns > 1) tex += `\\begin{multicols}{${ps.columns}}\\raggedcolumns\n`;
    for (const proj of displayProjects) {
      const linkPart = ps.showLinks && proj.linkUrl
        ? `\\href{${proj.linkUrl}}{${proj.linkLabel}}`
        : escapeLatex(proj.linkLabel);
      const tagsPart = ps.showTags && proj.tags.length > 0 ? `\\\\[${projVspace}]\\textit{${proj.tags.join(', ')}}` : '';
      tex += `\\begin{tcolorbox}[colback=kcvsoft, colframe=kcvlightgray, arc=4pt, boxsep=${boxSep}]
\\textbf{${proj.title}} \\hfill ${proj.yearRange}
\\\\
${linkPart}
\\\\
\\textit{${proj.description}}${tagsPart}
\\end{tcolorbox}
\\vspace{${projVspace}}
`;
    }
    if (ps.columns > 1) tex += '\\end{multicols}\n';
    tex += `\\vspace{0.5em}

`;
  }

  if (vis.focusAreas && focusItems.length > 0) {
    tex += `% KCV-BLOCK: focus
\\section{Focus Areas}
\\begin{itemize}
`;
    for (const area of focusItems) {
      tex += `\\item ${area}\n`;
    }
    tex += `\\end{itemize}
\\vspace{0.5em}

`;
  }

  if (vis.certifications && certItems.length > 0) {
    const certVspace = spacingValue(cs.spacing, '0.4em', 0);
    tex += `% KCV-BLOCK: certifications
\\section{Certifications}
`;
    if (cs.columns > 1) tex += `\\begin{multicols}{${cs.columns}}\\raggedcolumns\n`;
    tex += '\\begin{itemize}\n';
    for (const cert of certItems) {
      tex += `\\item ${cert}\n`;
    }
    tex += '\\end{itemize}\n';
    if (cs.columns > 1) tex += '\\end{multicols}\n';
    tex += `\\vspace{0.5em}

`;
  }

  tex += `\\end{document}`;
  // Append custom blocks in configured order
  tex = renderCustomBlocks(tex, resume);
  return tex;
}

function renderCustomBlocks(tex: string, resume: Resume): string {
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

    if (cb.type === 'customText') {
      const paragraphs = (cb as { paragraphs: string[] }).paragraphs.filter((p) => p.trim());
      if (!paragraphs.length) continue;
      tex += `% KCV-BLOCK: customText:${cb.id}
\\section{${blockTitle}}
`;
      for (const p of paragraphs) {
        tex += `${escapeLatex(p)}\n\n`;
      }
    } else if (cb.type === 'languages') {
      const items = (cb as { items: { language: string; proficiency?: string }[] }).items.filter((i) => i.language.trim());
      if (!items.length) continue;
      tex += `% KCV-BLOCK: languages:${cb.id}
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
      if (!items.length) continue;
      tex += `% KCV-BLOCK: awards:${cb.id}
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
      if (!items.length) continue;
      tex += `% KCV-BLOCK: links:${cb.id}
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