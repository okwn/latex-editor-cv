export interface LatexTemplate {
  id: string;
  name: string;
  description: string;
  preamble: string;
  sectionCommands: Record<string, string>;
}

export const defaultTemplate: LatexTemplate = {
  id: 'modern-cv',
  name: 'Modern CV',
  description: 'A clean, professional LaTeX CV template',
  preamble: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{setspace}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\definecolor{primary}{HTML}{2C3E50}
\\definecolor{secondary}{HTML}{7F8C8D}
\\setstretch{1.2}`,
  sectionCommands: {
    header: '\\makecvheader',
    contact: '\\cvitem',
    experience: '\\cvexperience',
    education: '\\cveducation',
    skills: '\\cvskills',
    projects: '\\cvprojects',
    languages: '\\cvlanguages',
    certifications: '\\cvcertifications',
  },
};