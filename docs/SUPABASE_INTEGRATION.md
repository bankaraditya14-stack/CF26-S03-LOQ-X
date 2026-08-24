# Cascade City: Supabase Integration & Cloud Architecture (Phase 1 & Phase 2)

## 1. Architectural Foundation & Core Principle

Cascade City maintains a strict separation between **infrastructure cascade simulation** and **cloud data persistence**.

> ### ⚡ Primary Architectural Rule
> **"Supabase stores scenarios and simulation results. It does not calculate infrastructure cascades."**
>
> The `SimulationEngine` and all discrete event algorithms remain **100% pure in-memory deterministic TypeScript algorithms**. They have zero dependencies on Supabase, network connectivity, or external databases.

```
       ┌───────────────────────────────┐
       │           React UI            │
       │ (Mission Control / Builder)   │
       └──────┬─────────────────┬──────┘
              │                 │
     (1) User Dispatches        │ (3) Persist Scenarios
         Scenario & Actions     │     & Simulation Runs
              │                 ▼
              │      ┌───────────────────────────────┐
              │      │    Persistence Repositories   │
              │      │ (ScenarioRepo / RunRepo)      │
              │      └──────────────┬────────────────┘
              │                     │
              ▼          ┌──────────┴──────────┐
   ┌───────────────────┐ ▼                     ▼
   │ SimulationEngine  │ ┌────────────────┐ ┌────────────────┐
   │ (Pure Determinism)│ │    Supabase    │ │  localStorage  │
   └──────────┬────────┘ │  (Cloud Sync)  │ │   (Fallback)   │
              │          └────────────────┘ └────────────────┘
     (2) Produces Events
         & Cascade Metrics
```

---

## 2. Authentication & Guest vs Authenticated Experience

Cascade City uses **Supabase Email/Password Authentication** (`@supabase/supabase-js`).

### Guest Experience (Offline & Local)
Authentication is **never mandatory** for evaluating the resilience model. Guests can:
- Explore the interactive 2D Digital-Twin city grid
- Run all 5 predefined benchmark scenarios
- Construct and test multi-node custom disruptions locally (saved to `localStorage`)
- Deploy recovery interventions (emergency generators, load shedding, circuit isolation)
- Inspect causal dependency chains via "Why Did This Fail?"
- Execute deterministic reproducibility verification

### Authenticated Experience (Cloud Enabled)
Logged-in users automatically get access to:
- **Cloud Custom Scenarios**: Save custom disruptions to Supabase scoped to `auth.uid()`.
- **Cross-Device Scenario Library**: Load and manage scenarios across browsers and devices.
- **Simulation Audit Trail & History**: Historical records of all completed runs, including peak impact, stabilization time, cascade depth, and complete event logs.

---

## 3. Database Schema & Migrations

All SQL migrations are stored in [`supabase/migrations/`](file:///c:/Users/Aditya%20BANKAR/Desktop/urban-infrastructure-cascade/supabase/migrations/):

### Migration Files
1. [`001_initial_schema.sql`](file:///c:/Users/Aditya%20BANKAR/Desktop/urban-infrastructure-cascade/supabase/migrations/001_initial_schema.sql): Creates `scenarios` and `simulation_runs` tables, indexes, and initial RLS setup.
2. [`002_user_scoped_rls.sql`](file:///c:/Users/Aditya%20BANKAR/Desktop/urban-infrastructure-cascade/supabase/migrations/002_user_scoped_rls.sql): Adds `user_id` foreign key on `simulation_runs` and enforces user-isolated RLS policies.

### Tables Specification

#### Table: `scenarios`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Scenario identifier |
| `user_id` | `UUID NULL REFERENCES auth.users(id)` | Creator's user ID (NULL for system benchmarks) |
| `name` | `TEXT NOT NULL` | Scenario title |
| `description` | `TEXT NULL` | Context / threat description |
| `graph_version` | `TEXT NOT NULL` | Target graph schema version (e.g. `city-v1`) |
| `initial_failures` | `JSONB NOT NULL` | Array of `{ nodeId, time }` seed disruptions |
| `parameters` | `JSONB NULL` | Simulation timing and propagation parameters |
| `recovery_actions` | `JSONB NULL` | Scheduled recovery interventions |
| `created_at` / `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | Row timestamps |

#### Table: `simulation_runs`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Unique run identifier |
| `user_id` | `UUID NULL REFERENCES auth.users(id)` | User who executed the run |
| `scenario_id` | `UUID NULL REFERENCES scenarios(id)` | Linked scenario |
| `graph_version` | `TEXT NOT NULL` | City graph version (`city-v1`) |
| `initial_failures` | `JSONB NOT NULL` | Seed disruptions |
| `metrics` | `JSONB NOT NULL` | Computed impact metrics (`cascadeDepth`, `affectedServices`, etc.) |
| `event_log` | `JSONB NOT NULL` | Full discrete event stream sequence |
| `deterministic_hash` | `TEXT NOT NULL` | DJB2 verification hash of metrics and timestamps |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | Execution timestamp |

---

## 4. Row Level Security (RLS) Configuration

RLS is enabled on all tables with zero bypass:
- **`scenarios`**:
  - `SELECT`: `(auth.uid() = user_id) OR (user_id IS NULL)` (users view their own custom scenarios + public system templates)
  - `INSERT` / `UPDATE` / `DELETE`: `auth.uid() = user_id` (users can only modify their own scenarios)
- **`simulation_runs`**:
  - `SELECT` / `INSERT` / `DELETE`: `auth.uid() = user_id` (runs are strictly private to the authenticated creator)

---

## 5. Setting Up Supabase for Local / Production Development

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. In the **SQL Editor**, run the contents of [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/Aditya%20BANKAR/Desktop/urban-infrastructure-cascade/supabase/migrations/001_initial_schema.sql) and [`supabase/migrations/002_user_scoped_rls.sql`](file:///c:/Users/Aditya%20BANKAR/Desktop/urban-infrastructure-cascade/supabase/migrations/002_user_scoped_rls.sql).

### Step 2: Configure Environment Variables
1. Go to **Project Settings -> API** in the Supabase Dashboard.
2. Copy **Project URL** and the **`anon` (public)** key.
3. In the project root, create `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
   ```

### Step 3: Run the Application
```bash
npm run dev
```
The header will display **`● CLOUD CONNECTED`** and all authentication and cloud persistence features will be active.

---

## 6. Offline & LocalStorage Fallback Behavior

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not provided, or if network connectivity is lost:
- The UI gracefully displays **`● LOCAL MODE`** (with tooltip: *"Cloud storage unavailable. Your local scenarios remain available."*).
- `ScenarioRepository` and `SimulationRunRepository` automatically redirect read/write calls to browser `localStorage` (`StorageService`).
- No crashes, alerts, or unhandled promise rejections occur.
