/**
 * Template registry — imports all template modules to trigger their registration.
 * This file exists to solve the side-effect import problem:
 * kcvModernTemplate.ts registers itself when imported, but nothing was importing it.
 * Importing this file ensures all templates are registered in TEMPLATES before use.
 */

// Import kcvModernTemplate to trigger its registerTemplate() call
import '@/lib/templates/kcvModernTemplate';

export { TEMPLATES, getTemplate, DEFAULT_TEMPLATE_ID, registerTemplate } from './templateRegistry';
export type { Template, TemplateSupports } from './templateRegistry';