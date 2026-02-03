# Predifi Backend V2

Clean rebuild of Predifi backend for the Arena product line and new architecture.

## Purpose

This is a **from-scratch implementation** following our architectural pivot. The original backend (`../backend/`) is preserved as reference but not actively developed.

## Key Differences from V1

- **Arena-focused**: Built specifically for trading competitions and arena management
- **Simplified architecture**: Single API service instead of microservices sprawl
- **GMX Native Integration**: Direct GMX SDK usage, no aggregation layer
- **Smart contract first**: Backend as thin orchestration layer for on-chain logic

## Tech Stack (TBD)

- Node.js + TypeScript
- Express/Fastify (API server)
- PostgreSQL (primary DB)
- Redis (caching/sessions)
- Ethers.js (blockchain interaction)

## Planned Services

1. **Arena API** - Competition management, user profiles, leaderboards
2. **Settlement Service** - Position tracking, PnL calculation, winner determination
3. **Admin Dashboard** - Competition creation, trader management

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## Migration Strategy

Reference `../backend/` for:
- Database schemas (market-service, wallet-analytics)
- WebSocket patterns (ws-service)
- Authentication logic (shared-types)
- Deployment configs (Dockerfile, cloudbuild.yaml)

**Do NOT copy/paste entire services** - extract patterns only.

## Development

**Status**: 🚧 Initial setup - no services yet

**First Steps**:
1. Initialize Node.js project with TypeScript
2. Set up project structure (src/, tests/, config/)
3. Configure ESLint + Prettier
4. Create basic Express API with /health endpoint
5. Set up PostgreSQL connection
6. Define arena data models

---

**Note**: This is the active development backend. Use `../backend/` as read-only reference only.
