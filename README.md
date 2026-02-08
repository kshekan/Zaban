# Zaban

A personal language learning app for Arabic and Farsi. Zaban (زبان — "language" in Farsi) helps you build vocabulary, master verb conjugations, practice translations, and retain everything with spaced repetition flashcards.

## Features

- **Vocabulary** — Add, edit, import (CSV), and browse words with translations, transliterations, and categories
- **Verb Conjugation** — AI-generated conjugation tables with full tense/person grids, verb metadata (root, masdar, verb type), and retry support
- **Translation** — Reference mode for quick lookups and practice mode with AI-powered feedback on your attempts
- **Flashcards** — SM-2 spaced repetition review for both vocabulary and conjugation cards
- **Multi-language** — Arabic (MSA) and Farsi with per-language data isolation
- **Dark mode** — System-aware theme switching

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, Turbopack)
- **Database**: SQLite via drizzle-orm + better-sqlite3
- **AI**: Anthropic Claude API for conjugation generation, translation, and practice feedback
- **UI**: shadcn/ui + Tailwind CSS v4
- **Font**: IBM Plex Sans Arabic for target language text
- **SRS**: SM-2 spaced repetition algorithm

## Getting Started

### Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Install dependencies
npm install

# Set your API key (or configure it later in the Settings page)
export ANTHROPIC_API_KEY=sk-ant-...

# Push the database schema
npx drizzle-kit push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start learning.

### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch --no-deploy --copy-config

# Set your API key as a secret
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy
fly deploy
```

The app uses a persistent volume (`/data/zaban.db`) for SQLite storage on Fly.io. The machine auto-stops when idle and auto-starts on requests.
