# Adding a New LaTeX CV Template

KCV uses a `Template` interface and a registry pattern. Adding a new template takes three steps.

## 1. Create the template file

Create `src/lib/templates/<myTemplate>.ts`:

```ts
import type { Resume } from '@/types/resume';
import type { Template } from './templateRegistry';
import { registerTemplate } from './templateRegistry';

export function renderMyTemplate(resume: Resume): string {
  // Convert resume JSON into a complete .tex string.
  // All user-generated text must be escaped using escapeLatex() and escapeLatexForUrl().
  const tex = `...`;
  return tex;
}

const myTemplate: Template = {
  id: 'my-template',
  name: 'My Template Name',
  description: 'One-line description shown in the template selector.',
  render: renderMyTemplate,
  supports: {
    projects: true,
    certifications: true,
    focusAreas: true,
    twoColumnProjects: true,
    twoColumnEducation: true,
  },
};

registerTemplate(myTemplate);
```

## 2. Register at app startup

Import the file somewhere that is always loaded at startup, e.g. in the template registry itself:

```ts
// src/lib/templates/templateRegistry.ts
import './myTemplate'; // registers automatically via side-effect
import type { Template } from './templateRegistry';
// ...
```

## 3. Template interface

```ts
interface Template {
  id: string;           // unique slug, e.g. 'kcv-modern'
  name: string;         // display name
  description: string;   // short description
  render: (resume: Resume) => string;  // returns full .tex document
  supports: {
    projects: boolean;              // template can render projects
    certifications: boolean;        // template can render certifications
    focusAreas: boolean;           // template can render focus areas
    twoColumnProjects: boolean;    // template uses 2-column layout for projects
    twoColumnEducation: boolean;  // template uses 2-column layout for education
  };
}
```

## Guidelines

- **LaTeX escaping**: All user-provided text (names, descriptions, URLs, etc.) must be escaped:
  - Use `escapeLatex(text)` for regular text
  - Use `escapeLatexForUrl(url)` for href values
  - Import from `@/lib/latex/escapeLatex`

- **KCV-BLOCK markers**: Include `% KCV-BLOCK: <section>` comments in your LaTeX output for click-to-edit navigation to work.

- **No fabrications**: Do not add fake data to the LaTeX. Only render what exists in resume JSON.

- **Package dependencies**: Document the required LaTeX packages in your template file comment block.

- **Rendering**: The `render` function receives a fully-typed `Resume` object. Access fields directly — do not assume defaults.
