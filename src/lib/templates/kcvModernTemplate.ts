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
\\newcommand{\\cvname}[1]{\\textbf{\\LARGE\\color{kcvprimary}{#1}}\\\\}

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

function renderKcvModern(resume: Resume): string {
  const { personal, summary, education, skillGroups, projects, focusAreas, certifications } = resume;

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

  const projectItems = projects.map((p) => ({
    title: escapeLatex(p.title),
    yearRange: escapeLatex(p.yearRange),
    linkLabel: escapeLatex(p.linkLabel),
    linkUrl: p.linkUrl ? escapeLatexForUrl(p.linkUrl) : '',
    description: escapeLatex(p.description),
    tags: p.tags ? p.tags.map((t) => escapeLatex(t)) : [],
    priority: p.priority || '',
  }));

  const focusItems = focusAreas.map((a) => escapeLatex(a));
  const certItems = certifications.map((c) => escapeLatex(c));

  const preamble = kcvTemplatePreamble(defaultTemplateConfig);

  let tex = `\\documentclass[11pt,a4paper]{article}
${preamble}

\\begin{document}
\\raggedright
\\setstretch{1.1}

% KCV-BLOCK: header
\\cvname{${name}}
\\cvrole{${role}}

\\begin{tabular}{l}
\\contactitem{Envelope}{Email}{${email}}
\\contactitem{Github}{GitHub}{${github}}
${linkedin ? `\\contactitem{Linkedin}{LinkedIn}{${linkedin}}` : ''}
${website ? `\\contactitem{Globe}{Web}{${website}}` : ''}
${location ? `\\contactitem{MapMarker}{Location}{${location}}` : ''}
${phone ? `\\contactitem{Phone}{Tel}{${phone}}` : ''}
\\end{tabular}
\\vspace{1em}

% KCV-BLOCK: summary
\\section{Summary}
${summaryText}

`;

  if (eduItems.length > 0) {
    tex += `% KCV-BLOCK: education
\\section{Education}
\\begin{multicols}{2}
\\raggedcolumns
`;
    for (const edu of eduItems) {
      tex += `\\vspace{0.4em}
\\textbf{${edu.degree}} \\hfill ${edu.startYear}--${edu.endYear}${edu.status ? ` (${edu.status})` : ''}
\\\\
\\textit{${edu.institution}}${edu.city ? `, ${edu.city}` : ''}
\\\\
`;
    }
    tex += `\\end{multicols}
\\vspace{0.5em}

`;
  }

  if (skillItems.length > 0) {
    tex += `% KCV-BLOCK: skills
\\section{Skills}
`;
    for (const group of skillItems) {
      tex += `\\skillgroup{${group.groupName}}{${group.skills.join(', ')}}\n`;
    }
    tex += `\\vspace{0.5em}

`;
  }

  if (projectItems.length > 0) {
    tex += `% KCV-BLOCK: projects
\\section{Projects}
\\begin{multicols}{2}
\\raggedcolumns
`;
    for (const proj of projectItems) {
      const linkPart = proj.linkUrl
        ? `\\href{${proj.linkUrl}}{${proj.linkLabel}}`
        : escapeLatex(proj.linkLabel);
      const tagsPart = proj.tags.length > 0 ? `\\\\[0.3em]\\textit{${proj.tags.join(', ')}}` : '';
      tex += `\\begin{tcolorbox}[colback=kcvsoft, colframe=kcvlightgray, arc=4pt, boxsep=4pt]
\\textbf{${proj.title}} \\hfill ${proj.yearRange}
\\\\
${linkPart}
\\\\
\\textit{${proj.description}}${tagsPart}
\\end{tcolorbox}
\\vspace{0.5em}
`;
    }
    tex += `\\end{multicols}
\\vspace{0.5em}

`;
  }

  if (focusItems.length > 0) {
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

  if (certItems.length > 0) {
    tex += `% KCV-BLOCK: certifications
\\section{Certifications}
\\begin{multicols}{3}
\\raggedcolumns
\\begin{itemize}
`;
    for (const cert of certItems) {
      tex += `\\item ${cert}\n`;
    }
    tex += `\\end{itemize}
\\end{multicols}

`;
  }

  tex += `\\end{document}`;
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