/**
 * Escapes special LaTeX characters in a string.
 * Use this for all user-generated text that will appear in LaTeX output.
 * Does NOT escape URLs — use escapeLatexForUrl for link content.
 */
export function escapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Escapes text intended for use inside an href URL.
 * Only escapes characters that would break LaTeX URL parsing.
 */
export function escapeLatexForUrl(text: string): string {
  if (!text) return '';
  return text.replace(/[#$%\\]/g, (c) => `\\${c}`);
}

/**
 * Wraps text in href only if url is truthy, otherwise returns plain text.
 */
export function maybeLink(label: string, url: string | undefined): string {
  const safeLabel = escapeLatex(label);
  if (!url) return safeLabel;
  return `\\href{${escapeLatexForUrl(url)}}{${safeLabel}}`;
}

/**
 * Conditionally renders a LaTeX block only if content exists.
 */
export function maybeBlock(label: string, content: string): string {
  return content.trim() ? `${label}\n${content}` : '';
}