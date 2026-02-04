# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de gestão de clínica médica com portal do paciente e agendamento inteligente. Usa React (frontend) + Supabase self-hosted (PostgreSQL) + Evolution API (WhatsApp).

## Common Commands

```bash
# Development
make setup          # First-time setup (creates .env, SSL certs, directories)
make dev            # Start development mode (without nginx)
make down           # Stop all containers
make logs           # Follow all container logs

# Database
make migrate        # Run Prisma migrations
make studio         # Open Prisma Studio GUI
make shell-db       # PostgreSQL shell (psql)

# Production
make prod           # Start with nginx/SSL
make deploy         # Deploy to VPS (./scripts/deploy.sh)
make build          # Rebuild images (--no-cache)

# Frontend only (if running outside Docker)
cd frontend && npm install && npm start
```

## Architecture

### Stack
- **Frontend:** React 18 + TypeScript + Styled Components + React Router v7
- **Backend:** Supabase self-hosted (PostgreSQL 15 + GoTrue + PostgREST + Realtime)
- **Communication:** Evolution API (WhatsApp), Twilio (SMS), Resend (Email)
- **Infrastructure:** Docker Compose (16 services), Nginx reverse proxy, Let's Encrypt SSL

### Key Directories
```
frontend/src/
├── components/scheduling/   # Appointment components (Card, List, TimeSlotPicker, etc.)
├── context/                 # AuthContext, LoadingContext
├── hooks/                   # useAppointments, useAvailability, useEligibility, useProviders
├── pages/scheduling/        # AppointmentsPage, NewAppointmentPage, AppointmentDetailPage
├── lib/supabaseClient.ts    # Supabase client + callRPC helper
└── types/database.ts        # TypeScript types for all entities

supabase/
├── migrations/              # SQL schema + RPC functions
├── volumes/functions/       # Edge Functions
└── docker-compose.yml       # 13 Supabase services
```

### Data Flow Pattern
```
React Component → Custom Hook (useAppointments) → callRPC() → Supabase RPC → PostgreSQL
                                                            ↑
                                                      RLS validates auth.uid()
```

### Database Tables
- `profiles` - User profiles (extends auth.users), includes patient_type, last_visit_at, labs_completed_at
- `providers` - Medical providers with specialty
- `provider_schedules` - Weekly availability (day_of_week, start_time, end_time)
- `appointments` - Scheduled appointments with status workflow

### RPC Functions (in migrations/001_scheduling_tables.sql)
- `get_available_slots(provider_id, date, type)` → Returns available time slots
- `check_patient_eligibility(patient_id, type)` → Validates TRT/hormone requirements
- `create_appointment(...)` → Creates with validation (eligibility, availability, 24h advance)

## Business Rules

### Eligibility Rules (enforced in PostgreSQL)
- **TRT/Hormone patients:** Require labs completed within 6 months + medical visit within 6 months
- **New patients:** Can only book `initial_consultation`
- **All patients:** Max 1 appointment per day, minimum 24h advance booking

### Appointment Status Flow
```
pending → confirmed → checked_in → in_progress → completed
                 ↓                              ↓
              cancelled                      no_show
```

## Code Patterns

### Hooks Pattern
```typescript
// All data hooks follow this pattern
const { data, loading, error, refetch, create, update } = useHookName();
```

### Supabase RPC Calls
```typescript
import { callRPC } from '../lib/supabaseClient';
const result = await callRPC<ReturnType>('function_name', { param1, param2 });
```

### Row Level Security
All tables have RLS enabled. Policies use `auth.uid()` to filter data:
- Patients see only their own data
- Providers see appointments where they are assigned
- Admins have full access

## Environment Variables

Key variables in `.env`:
- `REACT_APP_SUPABASE_URL` - Supabase API URL (default: http://localhost:8000)
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- `POSTGRES_PASSWORD`, `JWT_SECRET` - Security credentials (change in production)

## Docker Network

Internal communication uses container names (never changes between local/VPS):
- Frontend → `supabase-kong:8000`
- Any service → `supabase-db:5432`

External ports exposed:
- 3000 (frontend), 8000 (Supabase/Kong), 8082 (Evolution API), 5432 (PostgreSQL)
