# JeliTraining — Coach Dashboard

A personal training management app built with React + Vite. Manage clients, track sessions, measurements, goals, payments, and generate PDF programmes.

## Features

- Client profiles with nutrition analysis (BMR, TDEE, macros)
- Session tracking and body measurements with weight chart
- Goals, payments, and pack tracking
- PDF programme generator
- WhatsApp / SMS payment reminder
- Monthly stats dashboard
- Cloud sync via Supabase with localStorage fallback
- PWA — installable on iPhone/Android
- Password-protected single-user access

## Tech Stack

React 18 · Vite · Recharts · Supabase · Vercel

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com) and run this in the SQL editor:

```sql
create table store (
  key text primary key,
  value text
);
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp jelitraining/.env.example jelitraining/.env.local
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_KEY` | Your Supabase publishable (anon) key |
| `VITE_DEFAULT_PW` | Default login password (change after first login) |
| `VITE_COACH_NAME` | Coach first name — shown in dashboard greeting |
| `VITE_COACH_FULLNAME` | Coach full name — shown in PDF footer |
| `VITE_COACH_INITIALS` | 2-letter initials — shown in sidebar/login |
| `VITE_COACH_EMAIL` | Email — shown in PDF and relance message |
| `VITE_COACH_INSTAGRAM` | Instagram handle — shown in PDF |
| `VITE_COACH_CITY` | City — shown in PDF header |
| `VITE_COACH_TITLE` | Certification/title — shown in PDF footer |
| `VITE_PAYMENT_LINK` | Payment link — included in relance messages |

### 3. Run locally

```bash
cd jelitraining
npm install
npm run dev
```

### 4. Deploy

The app is configured for Vercel. Add all `VITE_*` env vars in your Vercel project settings, then:

```bash
vercel --prod
```

## Tests

```bash
cd jelitraining
npm test
```
