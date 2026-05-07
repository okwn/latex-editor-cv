import { Resume } from '@/types/resume';

export const defaultResume: Resume = {
  personal: {
    fullName: 'Oğuz Kartal',
    role: 'Product Architect | DevOps | AI-Assisted Software Builder',
    phone: '+90 5XX XXX XXXX',
    email: 'hey@oguzkartal.com',
    github: 'github.com/okwn',
    website: 'oguzkartal.com',
    location: 'Istanbul, Turkey',
  },
  summary: {
    professionalSummary:
      'Fifteen years of experience across multiple technologies and domains. Strong background in architecting scalable systems, CI/CD pipelines, and cloud infrastructure. Proficient with AI-assisted development workflows and full-cycle product management. Experienced in leading teams and delivering production-grade software.',
  },
  education: [
    {
      id: '1',
      degree: 'Computer Science & Engineering',
      institution: 'Bahçeşehir University',
      city: 'Istanbul',
      startYear: '2009',
      endYear: '2014',
      status: 'graduated',
    },
  ],
  skillGroups: [
    {
      id: '1',
      groupName: 'Backend',
      skills: ['Go', 'Python', 'Node.js', 'PostgreSQL', 'Redis', 'gRPC', 'REST API'],
    },
    {
      id: '2',
      groupName: 'Frontend',
      skills: ['TypeScript', 'React', 'Next.js', 'TailwindCSS', 'shadcn/ui'],
    },
    {
      id: '3',
      groupName: 'Infrastructure & DevOps',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Ansible', 'ArgoCD', 'GitHub Actions', 'Helm'],
    },
    {
      id: '4',
      groupName: 'AI & LLM Tooling',
      skills: ['Claude API', 'OpenAI API', 'LangChain', 'Prompt Engineering', 'RAG', 'Fine-tuning'],
    },
    {
      id: '5',
      groupName: 'Observability',
      skills: ['Prometheus', 'Grafana', 'Loki', 'Jaeger', 'OpenTelemetry', 'ELK Stack'],
    },
    {
      id: '6',
      groupName: 'Practices',
      skills: ['System Design', 'DDD', 'TDD', 'Clean Code', 'Technical Writing', 'Architecture Decision Records'],
    },
  ],
  projects: [
    {
      id: '1',
      title: 'claude-code-snippets',
      yearRange: '2025',
      linkLabel: 'github.com/okwn/claude-code-snippets',
      linkUrl: 'github.com/okwn/claude-code-snippets',
      description:
        'A VS Code extension that surfaces semantic search over a self-hosted vector database, letting teams share and reuse AI prompt patterns across the organization without sending data to third-party services.',
      tags: ['TypeScript', 'VS Code API', 'Qdrant', 'Embeddings', 'RAG'],
      priority: 'high',
    },
    {
      id: '2',
      title: 'mcp-deluge',
      yearRange: '2025',
      linkLabel: 'github.com/okwn/mcp-deluge',
      linkUrl: 'github.com/okwn/mcp-deluge',
      description:
        'CLI tool and config-driven pipeline that classifies incoming Model Context Protocol requests using a local LLM, routing them to the most appropriate AI provider or local model based on capability and cost. Currently used by two early-access teams to manage multi-provider AI traffic.',
      tags: ['Go', 'MCP Protocol', 'LLM Routing', 'CLI'],
      priority: 'high',
    },
    {
      id: '3',
      title: 'portfolio',
      yearRange: '2025',
      linkLabel: 'oguzkartal.com',
      linkUrl: 'https://oguzkartal.com',
      description:
        'Personal portfolio site built with Next.js and Tailwind CSS. Self-hosted on a VPS with a minimal Docker + Caddy stack. Zero analytics, no tracking. Source is public.',
      tags: ['Next.js', 'TailwindCSS', 'Docker', 'Caddy', 'Self-hosted'],
      priority: 'medium',
    },
    {
      id: '4',
      title: 'llm-tutor',
      yearRange: '2024',
      linkLabel: 'github.com/okwn/llm-tutor',
      linkUrl: 'github.com/okwn/llm-tutor',
      description:
        'A retrieval-augmented generation (RAG) tutoring app that lets users upload lecture notes and past exams, then ask questions against that corpus. Built as a side project to explore practical LLM integration patterns.',
      tags: ['Python', 'LangChain', 'FAISS', 'OpenAI', 'Flask'],
      priority: 'medium',
    },
    {
      id: '5',
      title: 'docter',
      yearRange: '2024',
      linkLabel: 'github.com/okwn/docter',
      linkUrl: 'github.com/okwn/docter',
      description:
        'A Markdown-first documentation tool with AI-assisted writing suggestions and intelligent cross-referencing. Built to solve the pain of maintaining internal documentation that is always outdated.',
      tags: ['TypeScript', 'ProseMirror', 'OpenAI', 'SQLite'],
      priority: 'low',
    },
  ],
  focusAreas: [
    'Architecting reliable, observable systems at scale',
    'AI-assisted development workflows and LLM integration patterns',
    'Full-cycle product ownership: from requirement to production',
    'Internal developer tooling and platform engineering',
  ],
  certifications: [
    'AWS Certified Solutions Architect – Professional (SAP-C02)',
    'Certified Kubernetes Administrator (CKA)',
    'Certified Prometheus Associate (PCA)',
  ],
  template: {
    templateId: 'kcv-modern',
    templateName: 'KCV Modern LaTeX',
  },
  customBlocks: [],
};