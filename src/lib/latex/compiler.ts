import { Resume } from '@/types/resume';

export function resumeToLatex(resume: Resume): string {
  const { personal, summary, education, skillGroups, projects, focusAreas, certifications } = resume;
  const { fullName, email, phone, github, website, location } = personal;

  let latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{setspace}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\definecolor{primary}{HTML}{2C3E50}
\\definecolor{secondary}{HTML}{7F8C8D}
\\setstretch{1.2}

\\begin{document}

\\section*{${escapeLatex(fullName)}}
\\vspace{-0.5em}
\\textit{${escapeLatex(personal.role)}}
\\vspace{0.5em}

\\begin{tabular}{l}
{\\small \\faEnvelope\\hspace{0.3em} ${escapeLatex(email)}} \\\\
{\\small \\faGithub\\hspace{0.3em} ${escapeLatex(github)}} \\\\
${website ? `{\\small \\faGlobe\\hspace{0.3em} ${escapeLatex(website)}} \\\\` : ''}
${location ? `{\\small \\faMapMarkerAlt\\hspace{0.3em} ${escapeLatex(location)}}` : ''}
\\end{tabular}
\\vspace{1em}

\\section*{Professional Summary}
${escapeLatex(summary.professionalSummary)}
`;

  if (education.length > 0) {
    latex += `\\section{Education}\\n`;
    for (const edu of education) {
      const status = edu.status ? ` (${edu.status})` : '';
      latex += `\\textbf{${escapeLatex(edu.degree)}} \\hfill ${edu.startYear} -- ${edu.endYear}${status}\\n`;
      latex += `\\textit{${escapeLatex(edu.institution)}}${edu.city ? `, ${escapeLatex(edu.city)}` : ''}\\n\\n`;
    }
  }

  if (skillGroups.length > 0) {
    latex += `\\section{Skills}\\n`;
    for (const group of skillGroups) {
      latex += `\\textbf{${escapeLatex(group.groupName)}:} ${group.skills.map((s) => escapeLatex(s)).join(', ')}\\n`;
    }
    latex += `\\n`;
  }

  if (projects.length > 0) {
    latex += `\\section{Projects}\\n`;
    for (const proj of projects) {
      latex += `\\textbf{${escapeLatex(proj.title)}} \\hfill ${proj.yearRange}\\n`;
      if (proj.linkUrl) {
        latex += `\\texttt{${escapeLatex(proj.linkLabel)}}\\n`;
      }
      latex += `\\textit{${escapeLatex(proj.description)}}\\n`;
      if (proj.tags && proj.tags.length > 0) {
        latex += `\\textit{${proj.tags.map((t) => escapeLatex(t)).join(', ')}}\\n`;
      }
      latex += `\\n`;
    }
  }

  if (focusAreas.length > 0) {
    latex += `\\section{Focus Areas}\\n`;
    latex += `\\begin{itemize}\\n`;
    for (const area of focusAreas) {
      latex += `\\item ${escapeLatex(area)}\\n`;
    }
    latex += `\\end{itemize}\\n`;
  }

  if (certifications.length > 0) {
    latex += `\\section{Certifications}\\n`;
    latex += `\\begin{itemize}\\n`;
    for (const cert of certifications) {
      latex += `\\item ${escapeLatex(cert)}\\n`;
    }
    latex += `\\end{itemize}\\n`;
  }

  latex += `\\end{document}`;
  return latex;
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (c) => `\\${c}`)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}