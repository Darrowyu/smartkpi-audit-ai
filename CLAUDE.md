# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartKPI Audit AI is a full-stack enterprise KPI performance management platform. It features a React frontend with a NestJS backend, using PostgreSQL for data persistence and Google Gemini AI for intelligent analysis.

## Project Structure

```
smartkpi-audit-ai/
├── frontend/          # React + TypeScript + Vite + TailwindCSS
├── backend/           # NestJS + Prisma + PostgreSQL
├── package.json       # Root workspace scripts
└── CLAUDE.md          # This file
```

## Development Commands

### Setup
```bash
npm run install:all   # Install all dependencies (root + frontend + backend)
```

### Run Development Server
```bash
npm run dev           # Start both frontend (5173) and backend (3000) concurrently
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

### Build
```bash
npm run build         # Build both frontend and backend
```

### Database
```bash
cd backend
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Seed initial data
npx prisma studio        # Open Prisma Studio
```

## Architecture Overview

### Multi-Tenant Architecture

The system uses a hierarchical multi-tenant model:
- **Group** (集团) - Top-level organization
- **Company** (公司) - Subsidiary within a group  
- **Department** (部门) - Team within a company
- **Employee** (员工) - Individual team member

### User Roles
- `SUPER_ADMIN` - Platform-wide access
- `GROUP_ADMIN` - Cross-company access within a group
- `MANAGER` - Department-level access
- `USER` - Personal data only

### Backend Modules (NestJS)

Located in `backend/src/modules/`:
- `auth` - JWT authentication
- `users` - User management
- `groups` - Group (corporation) management
- `companies` - Company management
- `departments` - Department management
- `employees` - Employee management
- `files` - File upload handling
- `kpi-analysis` - AI-powered KPI analysis (Gemini)
- `kpi-library` - KPI definition templates
- `assessment` - Assessment period management
- `calculation` - Score calculation engine
- `reports` - Report generation
- `permissions` - Role-based access control
- `queue` - Background job processing (Bull)

### Frontend Structure (React)

Located in `frontend/src/`:
- `components/` - UI components
  - `views/` - Main page views
  - `ui/` - Shadcn/Radix UI components
  - `auth/` - Authentication components
  - `layout/` - Layout components (Sidebar)
- `api/` - API client functions
- `context/` - React context (AuthContext)
- `utils/` - Utility functions
- `types.ts` - TypeScript type definitions

### Available Views
`landing`, `dashboard`, `kpi-management`, `team-management`, `reports`, `history`, `settings`, `upload`, `organization`, `company`, `kpi-library`, `assessment`, `data-entry`, `permissions`, `assignment`, `group-dashboard`

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn UI (Radix)
- Recharts (charts)
- React Hook Form + Zod (forms)
- Axios (HTTP client)

### Backend
- NestJS 11
- Prisma 7 (ORM)
- PostgreSQL (database)
- Bull (job queue, Redis-backed)
- @google/genai (Gemini AI)
- Passport + JWT (authentication)

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"    # CHANGE IN PRODUCTION
JWT_EXPIRATION="15m"
GEMINI_API_KEY="your-api-key"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000/api
```

## Key Patterns

### API Structure
All API endpoints are prefixed with `/api` and follow RESTful conventions:
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Authentication Flow
1. User logs in via `/api/auth/login`
2. Server returns JWT token
3. Frontend stores token in localStorage
4. Token is sent in `Authorization: Bearer <token>` header
5. Backend validates token via `JwtAuthGuard`

### KPI Calculation Flow
1. Define KPIs in KPI Library
2. Create Assessment Period
3. Assign KPIs to departments/employees
4. Submit actual values (manual or Excel import)
5. Calculate scores (triggered manually or via queue)
6. View reports and rankings

## Important Notes

1. **Security**: Change `JWT_SECRET` in production
2. **Database**: Run `prisma migrate dev` after schema changes
3. **Types**: Frontend types in `frontend/src/types.ts`, backend enums from `@prisma/client`
4. **Styling**: Use Tailwind classes, follow existing patterns
5. **Error Handling**: Use toast notifications for user feedback

## Common Tasks

### Adding a New API Endpoint
1. Create DTO in `backend/src/modules/<module>/dto/`
2. Add service method in `<module>.service.ts`
3. Add controller route in `<module>.controller.ts`
4. Create frontend API function in `frontend/src/api/`

### Adding a New View
1. Create component in `frontend/src/components/views/`
2. Export from `frontend/src/components/views/index.ts`
3. Add view type to `View` in `frontend/src/types.ts`
4. Add route in `frontend/src/App.tsx`
5. Add menu item in `frontend/src/components/layout/Sidebar.tsx`
