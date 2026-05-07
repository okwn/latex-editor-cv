# KCV — CV-Maker

A local-first, AI-assisted web app for building, tailoring, compiling, and exporting professional LaTeX-based CVs as PDFs. Everything runs in your browser — your data never leaves your machine unless you explicitly export it.

---

## What is CV-Maker / KCV?

KCV is a developer-friendly CV builder that combines the precision of LaTeX with the convenience of a modern web UI. It is designed for engineers and technical professionals who want:

- Pixel-perfect PDF output without fighting LaTeX syntax by hand
- AI assistance to tailor a CV for a specific job description
- Full control over the final LaTeX source
- Local-first workflow with no cloud dependency
- Version snapshots you can restore at any time

---

## Core Features

### Block-based CV Editor
Structured form editors for each CV section: Header, Professional Summary, Education, Technical Skills, Selected Projects, Focus Areas, and Certifications. Changes are reflected immediately in the LaTeX source.

### LaTeX Source Editor
A full Monaco editor with LaTeX syntax highlighting, line numbers, error markers from the compiler output, and a Go-to-Line feature for navigating to specific errors.

### Live PDF Compile
One-click PDF compilation via a local LaTeX compiler (xelatex, pdflatex, latexmk, or tectonic). SyncTeX support enables approximate click-to-source navigation in the PDF preview.

### AI Tailoring
Paste a job description and the AI assistant analyzes your CV blocks against the job requirements. It suggests targeted edits — additions, rewrites, keyword injections — via a structured JSON patch system that you review before applying.

### Job Description Optimization
Beyond patch suggestions, the AI can rephrase your professional summary and focus areas to align with the language and priorities of the target role.

### PDF Export
Export the latest compiled PDF directly from the preview panel. A stale PDF warning appears if the LaTeX source has changed since the last compile.

### Full Bundle Export
Export everything as a ZIP containing:
- `resume.pdf` — compiled output (if available)
- `main.tex` — the LaTeX source
- `resume.json` — raw resume data for re-importing
- `README.txt` — file manifest

### Template Registry
Swap templates instantly via the Template section. The registry is plug-in based — adding a new template only requires registering a render function. One template is included by default (KCV Modern).

### Local-first Snapshots
Save named point-in-time snapshots of your full editor state (resume data, LaTeX source, template ID). Restore or delete snapshots from the Snapshots panel. Autosave is configurable with debounce intervals of 500ms, 1s, 2s, or 5s.

### JSON Export / Import
Download your resume as a JSON file for backup or transfer. Import any previously exported JSON to restore full editor state.

---

## Local Setup

### Prerequisites

A LaTeX distribution is required for PDF compilation. Choose one of the options below.

#### Ubuntu / Debian

```bash
sudo apt update
sudo apt install texlive-xetex texlive-latex-extra texlive-fonts-extra latexmk
```

#### Arch / CachyOS

```bash
sudo pacman -S texlive-core texlive-latexextra texlive-fontsextra latexmk
```

#### macOS

```bash
brew install --cask mactex        # full TeX Live (~5GB)
# OR
brew install tectonic             # minimal alternative (~300MB)
```

#### Windows

Use [Tectonic](https://tectonic.xyz) for a zero-config install, or install [TeX Live](https://www.tug.org/texlive/) natively.

#### Tectonic (compiler-agnostic option)

Tectonic requires no LaTeX installation and works on all platforms:

```bash
# Linux/macOS
curl -s https://tectonic.xyz/tectonic 2>/dev/null | head -1 || {
  wget https://github.com/tectonic/tectonic/releases/latest/download/tectonic-x86_64-unknown-linux-gnu.tar.gz
  tar -xzf tectonic-x86_64-unknown-linux-gnu.tar.gz
  sudo mv tectonic /usr/local/bin/
}
```

KCV auto-detects available compilers in this order of preference: `tectonic → latexmk → xelatex → pdflatex`.

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

### Docker

A containerized setup is provided for environments without a LaTeX installation. The image includes all required TeX Live packages.

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

To pass API keys, either uncomment the relevant lines in `docker-compose.yml` or set them in a `.env` file:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Then:

```bash
docker compose up --build
```

The `compiled-cvs` volume persists generated PDFs between runs.

---

## Environment Variables

Create a `.env.local` file in the project root. All keys are optional — the app works fully offline without them.

```env
# AI providers (at least one required for AI features)

# OpenAI (GPT-4o, GPT-4o-mini, etc.)
OPENAI_API_KEY=sk-...

# Anthropic (Claude 3.5 Sonnet, etc.)
ANTHROPIC_API_KEY=sk-ant-...

# OpenRouter (unified access to many models)
OPENROUTER_API_KEY=

# Ollama (self-hosted models, e.g. llama3, mixtral)
OLLAMA_BASE_URL=http://localhost:11434
```

When multiple keys are present, the app uses OpenAI by default. You can change the provider per-request in the AI drawer UI.

---

## AI Usage Notes

- **AI features are entirely optional.** The block editor, LaTeX editor, and PDF export work without any API keys.
- AI requests are sent directly from the browser to the configured provider — no proxy, no logging, no data retention beyond the immediate session.
- Patches generated by AI are **never applied automatically.** Every patch is shown in a review panel with a diff view; you decide what to accept or discard.
- The AI context includes the current LaTeX source, the active block being edited, and (when tailoring) the job description you pasted. No other CV data is sent unless you explicitly request a full-CK analysis.
- Running without API keys: the AI drawer shows a placeholder message; all other features remain fully functional.

---

## Security Notes

- **LaTeX compilation is local.** The compiler runs on your machine via a Next.js API route. No LaTeX source is ever sent to a remote service.
- **API keys stay on the client.** Keys are read from environment variables on the server side only when an AI request is made. They are never logged, exposed in error messages, or included in client bundles.
- **Do not deploy untrusted LaTeX to a public server** without sandboxing. The LaTeX compiler runs with the same OS permissions as the Next.js process. In containerized or multi-tenant deployments, use a properly sandboxed compilation service (e.g., a separate container with seccomp/AppArmor profiles, or a dedicated compilation microservice).
- **The JSON import is trusted.** Importing a JSON file overwrites the current editor state. Only import files from sources you control.
- **No authentication or multi-user support.** This app is designed for single-user local use. Do not expose it to the internet without adding your own authentication layer.

---

## Known Limitations

- **SyncTeX click mapping is best-effort.** SyncTeX records generated by the LaTeX compiler map PDF coordinates back to line numbers in the source. The accuracy depends on the compiler and the complexity of the template. In practice it works well for simple layouts but may be imperfect for heavily macro-driven templates.

- **AI patch review is required.** AI-generated patches are suggestions only. Always review the diff before applying. The app never applies patches silently.

- **A local LaTeX installation is required** for PDF compilation unless Tectonic is available on the system PATH. The compile API returns a clear error if no compiler is found.

- **Autosave does not trigger compiles.** Autosave persists state to localStorage; it does not automatically compile the PDF.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘S` / `Ctrl+S` | Save snapshot |
| `⌘↵` / `Ctrl+Enter` | Compile PDF |
| `⌘B` / `Ctrl+B` | Toggle blocks panel |
| `⌘J` / `Ctrl+J` | Toggle AI drawer |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

---

## Project Structure

```
src/
  app/
    api/
      compile/          # LaTeX → PDF compilation endpoint
      ai/               # AI patch + tailoring endpoint
    page.tsx            # Main editor page
    layout.tsx          # Root layout
    globals.css         # Global styles + CSS variables
  components/
    ai/                 # AI drawer, patch preview, job tailor
    blocks/             # Block editors + sidebar routing
    editor/             # Monaco LaTeX editor, CompileErrorsPanel,
                        # SnapshotManager, ExportPanel, TemplateSelector
    layout/             # TopBar, AiDrawer, CollapsiblePanel, LayoutShell
    preview/            # PDF viewer with page/zoom controls
    ui/                 # Toast, EmptyState, Skeletons, KeyboardShortcuts
  lib/
    compile/            # Compiler detection, spawn, log parsing
    latex/              # LaTeX rendering utilities
    resume/             # editorStore (Zustand), persistence (localStorage),
                        # defaultResume, schema types
    templates/          # Template registry + KCV Modern template
  types/
    resume.ts           # TypeScript types for resume data
```

---

## Roadmap

The following features are planned or under consideration:

- [ ] **More templates** — additional professionally designed CV layouts
- [ ] **Cover letter generator** — AI-assisted letter tailored to the same job description as the CV
- [ ] **ATS score checker** — analyze a job description and score how well the CV addresses it
- [ ] **GitHub project importer** — extract README content, commit stats, and repo details for the Projects section
- [ ] **LinkedIn importer** — parse a LinkedIn profile export to pre-populate CV fields
- [ ] **Dockerized compiler sandbox** — run LaTeX compilation in an isolated container for environments without a local LaTeX install

---

## License

MIT
