import type { Resume } from '@/types/resume';
import { escapeLatex, escapeLatexForUrl } from './escapeLatex';
import { kcvTemplatePreamble, defaultTemplateConfig } from '@/lib/templates/kcvModernTemplate';

/**
 * Renders a complete .tex string from resume JSON using the kcv-modern template.
 * All user-generated text is escaped for LaTeX safety.
 */
export function renderResumeLatex(resume: Resume): string {
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
${location ? `\\contactitem{MapMarkerAlt}{Location}{${location}}` : ''}
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
        : proj.linkLabel;
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
