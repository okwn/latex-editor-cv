# CV-Maker / KCV

**Local-first AI-assisted LaTeX CV builder.**

CV-Maker helps you create professional LaTeX-quality CVs with block-based editing, live PDF preview, template controls, snapshots, and AI-assisted tailoring for each job application.

---

> **Add screenshots to `docs/images/`** to see them here:
> - `dashboard.png`
> - `editor.png`
> - `preview.png`
> - `settings.png`

---

## Features

| | |
|---|---|
| **Dashboard workspace** | Manage multiple CV documents |
| **Block-based CV editing** | Structured editors: Header, Summary, Education, Skills, Projects, Focus Areas, Certifications |
| **Raw LaTeX editor** | Monaco editor with syntax highlighting, error markers, go-to-line |
| **Live local PDF compilation** | One-click compile via local LaTeX compiler (pdflatex / xelatex / latexmk / tectonic) |
| **Resizable PDF preview** | Drag panel separators to resize editor / preview panes |
| **Zoom and pan controls** | Fit Width, 100%, 150%, 200%, horizontal/vertical pan, reset view |
| **Template registry** | Swap templates instantly; KCV Modern included by default |
| **Block store** | Add/activate optional blocks: Languages, Awards, Links, Custom Text |
| **Per-block layout controls** | Alignment, column count, card size, spacing per block type |
| **Manual snapshots** | Save / restore / delete named snapshots of full editor state |
| **AI tailoring drawer** | Paste a job description; get targeted block edits as reviewable JSON patches |
| **Local provider / API key settings** | OpenAI, Anthropic, OpenRouter, Ollama — keys stay on your machine |
| **Export** | PDF, LaTeX source, or JSON (single file or ZIP bundle) |

---

## Why this exists

KCV is not an Overleaf clone. It is focused on **CV tailoring for specific job applications** — the workflow is: edit blocks, compile, export PDF, repeat for each application.

Overleaf is a full LaTeX IDE. KCV is a CV-specific tool that abstracts the LaTeX so you can focus on content and layout, not formatting commands. It gives you the PDF quality of LaTeX without the learning curve.

---

## Architecture

```
Resume JSON
    ↓
Template Renderer
    ↓
LaTeX Source
    ↓
Local Compiler (xelatex / pdflatex / latexmk / tectonic)
    ↓
PDF Preview / Export
```

---

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## LaTeX Setup

**Arch / CachyOS**
```bash
sudo pacman -S texlive-bin texlive-binextra texlive-latex texlive-latexrecommended \
  texlive-latexextra texlive-fontsrecommended texlive-fontsextra
```

**Ubuntu / Debian**
```bash
sudo apt update
sudo apt install texlive-xetex texlive-latex-extra texlive-fonts-extra latexmk
```

**macOS**
```bash
brew install --cask mactex        # full TeX Live (~5GB)
# OR
brew install tectonic            # minimal alternative (~300MB)
```

**Windows**

Use [Tectonic](https://tectonic.xyz) for a zero-config install, or install [TeX Live](https://www.tug.org/texlive/) natively.

KCV auto-detects compilers in order of preference: `tectonic → latexmk → xelatex → pdflatex`.

---

## Validation

```bash
npm run check:local          # environment readiness
npm run check:templates      # template registry integrity
npm run check:latex:static   # static LaTeX analysis
npm run check:latex          # full compile + PDF generation
npm run typecheck            # TypeScript
npm run lint                  # ESLint
npm run build                 # production build
```

---

## AI Settings

Configure in `.env.local` (optional — all features work offline without keys):

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

Supported providers: **OpenAI**, **Anthropic**, **OpenRouter**, **Ollama** (local).

- API keys are read server-side only when an AI request is made
- Keys are never logged or exposed in error messages
- **Do not use on shared machines with real secrets** — browser localStorage is not secure storage for API keys

AI features are entirely optional. The block editor, LaTeX editor, and PDF export work without any API configuration.

---

## Data Model

| Concept | Description |
|---|---|
| **CV document** | Stored in browser localStorage; key is the CV UUID |
| **resumeData** | The full JSON content: personal info, blocks, custom blocks, skill groups, projects, education, certifications |
| **resumeLayout** | Per-block configuration: active/inactive, order, per-type settings (alignment, columns, spacing) |
| **customBlocksOrder** | String array of custom block IDs, controls rendering order |
| **snapshots** | Named point-in-time copies of full editor state |
| **templateId** | Which template renders the LaTeX output |

---

## Known Limitations

- **SyncTeX source mapping is best-effort.** Works well for simple templates; may be imperfect for heavily macro-driven ones.
- **Browser localStorage is not secure secret storage.** Do not store real API keys on shared machines.
- **Local LaTeX compiler required.** Compile API returns a clear error if none is found on PATH.
- **Template customization targets KCV Modern first.** Other templates may not expose all layout controls yet.

---

## Roadmap

- [ ] More templates
- [ ] Cover letter generator
- [ ] ATS keyword analyzer
- [ ] LinkedIn import
- [ ] GitHub project importer
- [ ] Docker compiler sandbox
- [ ] Multi-page template controls
- [ ] Better SyncTeX mapping

---

## License

MIT