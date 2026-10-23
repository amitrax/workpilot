# WorkPilot

AI-powered workspace for customer relationship management, intelligent agents, knowledge bases, and workflow automation.

## Features

- **Multi-Tenant Architecture**: Workspace isolation with PostgreSQL Row-Level Security.
- **AI Agent Automation**: Autonomous customer communication and task handling.
- **Knowledge Base**: Vector-search-ready documentation and context management.
- **CRM & Analytics**: Comprehensive pipeline, leads, customer tracking, and conversion metrics.
- **Workflow Automation**: Visual automation builder and trigger-based execution.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

Configure environment variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: Your OpenAI API key (kept strictly server-side)

## Deployment

Deploy preview and production environments using [Vercel](https://vercel.com).
