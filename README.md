# Toastmasters District Statistics Visualizer

A data visualization platform for Toastmasters district leaders to track performance metrics, compare districts globally, and make data-driven decisions.

**Live site:** [ts.taverns.red](https://ts.taverns.red)

## Project Structure

This is a monorepo containing:

- `frontend/` - React + TypeScript + Vite application
- `backend/` - Node.js + Express + TypeScript API server (read-only, serves pre-computed data)
- `packages/collector-cli/` - Standalone CLI tool for scraping Toastmasters dashboard data
- `packages/analytics-core/` - Shared analytics computation library
- `packages/shared-contracts/` - Data contracts (types + Zod schemas) between packages

## Prerequisites

- Node.js 20+ and npm

## Getting Started

### Installation

Install dependencies for both frontend and backend:

```bash
npm install
```

### Configuration

1. Copy the example environment files:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

2. Update the environment variables in the `.env` files as needed.

#### Cache Configuration

The application uses a unified cache configuration system. Set the `CACHE_DIR` environment variable to configure where cached data is stored:

```bash
# Development (relative path)
CACHE_DIR=./cache

# Production (absolute path)
CACHE_DIR=/var/cache/toastmasters
```

For detailed cache configuration examples for different deployment scenarios, see [docs/CACHE_CONFIGURATION.md](./docs/CACHE_CONFIGURATION.md).

### Development

Run both frontend and backend in development mode:

```bash
# Run frontend (in one terminal)
npm run dev:frontend

# Run backend (in another terminal)
npm run dev:backend
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5001`.

### Building for Production

Build both projects:

```bash
npm run build:frontend
npm run build:backend
```

### Code Quality

Format code with Prettier:

```bash
npm run format
```

Lint code:

```bash
npm run lint
```

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router
- TanStack Query (React Query)
- Recharts
- Axios

### Backend

- Node.js
- Express
- TypeScript
- Zod for runtime validation
- In-memory caching

### Shared Packages

- `@toastmasters/shared-contracts` - TypeScript types and Zod schemas shared across all packages
- `@toastmasters/analytics-core` - Analytics computation engine (membership, club health, distinguished, leadership)

## Data Source

The application fetches data from the public Toastmasters dashboards at https://dashboards.toastmasters.org.

### Architecture Overview

The system uses a **two-process architecture** that separates data acquisition from data serving:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Collector CLI    │────▶│  Raw CSV Cache  │◀────│    Backend      │
│  (scrapes data) │     │  (shared cache) │     │ (serves data)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Collector CLI** (`packages/collector-cli/`): Standalone tool that scrapes Toastmasters dashboard, transforms data, and computes analytics
2. **Backend** (`backend/`): Read-only API server that serves pre-computed data from snapshots (no scraping, no computation)

This separation enables:

- Independent scheduling of scraping operations
- Backend remains responsive during scraping
- Scraping failures don't affect data serving
- Easier testing and maintenance

### Running the Collector

```bash
# Scrape all configured districts for today
npm run collector-cli -- scrape

# Scrape for a specific date
npm run collector-cli -- scrape --date 2025-01-10

# Scrape specific districts
npm run collector-cli -- scrape --districts 57,58,59

# Check cache status
npm run collector-cli -- status
```

### Mock Data vs Real Data

- **Mock Data** (default): Fast, fake data for development
- **Real Data**: Uses collector-cli to collect live data from Toastmasters dashboards

Toggle between them in `backend/.env`:

```bash
USE_MOCK_DATA=true   # Use mock data (fast)
USE_MOCK_DATA=false  # Use real data from cache (requires collector-cli to populate cache)
```

## Features

### Global Rankings

- Composite scoring system (Borda count) across all districts worldwide
- Region-level filtering and historical rank progression charts
- Scoring methodology breakdown with per-metric rankings

### District Overview

- Performance target cards with recognition-level thresholds (Distinguished → Smedley)
- World rank, region rank, and percentile for each metric
- Club health categorization (thriving / vulnerable / intervention required)
- Distinguished club projection and progress tracking
- DAP/DDP (Distinguished Area/Division Program) recognition panels

### Analytics

- Leadership effectiveness scores by division (weighted Health/Growth/DCP)
- Top growth clubs and DCP goal analysis
- Membership and payments trend charts with year-over-year comparison

### Club Detail

- Per-club membership trend graphs with historical data
- DCP goal progress, health score, and risk factors
- Division and area performance comparison

### Data & Export

- CSV export of district analytics
- Program year and date-specific snapshot selection
- Pre-computed analytics pipeline for fast page loads

## Project History

This project has evolved through multiple phases of development. Completed specifications have been archived in `.kiro/specs-archive/` for historical reference.

**Recent Completions (February 2026):**

- **remove-backend-backfill**: Removed all backfill code, redirecting to collector-cli
- **v8-heap-configuration**: V8 heap memory management for production stability
- **gcp-storage-migration**: Storage abstraction with GCP Firestore and Cloud Storage
- **openapi-documentation**: Comprehensive OpenAPI 3.0 specification
- **shared-data-contracts**: Shared TypeScript types and Zod schemas between packages

**Infrastructure & Architecture:**

- **collector-cli-separation**: Standalone scraping CLI tool
- **data-computation-separation**: Backend as read-only API, all computation in collector-cli
- **data-refresh-architecture**: Snapshot-based data architecture
- **raw-csv-cache-system**: CSV caching infrastructure

See `.kiro/specs-archive/README.md` for the complete list of 83 archived specifications.

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Production architecture:

- **Frontend**: Firebase Hosting (static SPA)
- **Backend**: Google Cloud Run (containerized API)
- **Storage**: Firestore (snapshots) + Cloud Storage (CSV cache)

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **CI** (`ci.yml`): Runs on every push — typecheck, lint, and test across all workspaces
- **Deploy** (`deploy.yml`): Builds Docker image, deploys backend to Cloud Run, deploys frontend to Firebase Hosting
- **PR Preview** (`pr-preview.yml`): On every PR that touches frontend code, deploys a temporary Firebase Hosting preview channel (7-day TTL) and posts the live URL as a PR comment
- **Data Pipeline** (`data-pipeline.yml`): Scheduled scraping and analytics computation

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for pre-deployment verification steps.

## Testing

Run tests:

```bash
# All tests
npm test

# Individual workspaces
npm run test:frontend
npm run test:backend
npm run test:analytics-core
npm run test:collector-cli
npm run test:shared-contracts

# Coverage report
npm run test:coverage
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
