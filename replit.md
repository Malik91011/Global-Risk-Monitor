# GlobeWatch360

## Overview

GlobeWatch360 is a global news intelligence and risk monitoring platform. It automatically scrapes news from worldwide sources, classifies incidents by category and risk level, generates threat assessments, and produces client-ready intelligence reports.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Maps**: react-simple-maps
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/          # Express API server (backend)
│   └── globewatch360/       # React + Vite frontend
├── lib/
│   ├── api-spec/            # OpenAPI spec + Orval codegen config
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas from OpenAPI
│   └── db/                  # Drizzle ORM schema + DB connection
└── scripts/                 # Utility scripts
```

## Features

- **Automated News Scraping**: Pulls from 12+ global RSS feeds (BBC, Al Jazeera, Reuters, CNN, Guardian, regional feeds)
- **AI Incident Classification**: Auto-classifies into 8 categories (Security, Crime, PublicSafety, Health, Hazards, Cyber, CivilPolitical, Other)
- **Risk Level Assessment**: 6 risk levels (Critical, High, HighImpact, Ongoing, Moderate, Low)
- **Threat Assessment Engine**: Generates detailed assessments with key threats, safety recommendations, and operational guidance
- **Report Generation**: Client-ready intelligence reports with executive summaries and advisories
- **PDF/Text Export**: Export reports as text files
- **Dashboard**: Global threat map, statistics, critical alerts, trending regions
- **Search & Filtering**: By country, region, city, category, risk level, date range
- **Google Ads**: Integrated with pub-3806563466848436
- **Scheduled Scraping**: Auto-runs every 30 minutes

## Database Schema

- `incidents` - News incidents with classification and location
- `threat_assessments` - AI-generated threat assessments
- `reports` - Generated intelligence reports

## API Routes

- `GET /api/incidents` - List incidents with filters
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents/:id/assess` - Generate threat assessment
- `GET /api/threats` - List threat assessments
- `POST /api/reports/generate` - Generate intelligence report
- `GET /api/reports` - List reports
- `GET /api/reports/:id/export` - Export report
- `POST /api/scraper/trigger` - Manually trigger scrape
- `GET /api/scraper/status` - Get scraper status
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/countries` - Country-level statistics
- `GET /api/stats/trending` - Trending regions

## Key Files

- `artifacts/api-server/src/lib/scraper.ts` - RSS feed scraper + scheduler
- `artifacts/api-server/src/lib/classifier.ts` - NLP-based incident classifier
- `artifacts/api-server/src/lib/assessmentGenerator.ts` - Threat assessment + report generator
- `lib/db/src/schema/` - Database schema definitions
- `lib/api-spec/openapi.yaml` - Full OpenAPI specification
