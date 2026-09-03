# Plant Nursery Management Demo

End-to-end demo: React (Vite) UI + ASP.NET Core 8 API + MySQL. JWT roles `Admin` | `User`, species/batches CRUD, watering due/overdue, and sale-readiness rules.

## Prerequisites

- Node.js 18+
- .NET 8 SDK (or newer SDK that can target `net8.0`)
- MySQL 8 (create database `plant_nursery`)

## Backend (API)

Project: `backend/` (`PlantNursery.Api`)

### 1. Configure MySQL

Create the database (once):

```sql
CREATE DATABASE plant_nursery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Edit the connection string placeholder in `backend/appsettings.json`:

```json
"ConnectionStrings": {
  "Default": "Server=localhost;Port=3306;Database=plant_nursery;User=root;Password=YOUR_PASSWORD;"
}
```

Replace `YOUR_PASSWORD` with your local MySQL root (or app user) password. The `Development` environment also reads `backend/appsettings.Development.json`, which is the right place for a local password so it is not the production-shaped default.

### 2. Apply migrations (and seed)

On first successful API start, `DbSeeder` runs `MigrateAsync` and seeds users/species/batches. You can also apply explicitly:

```bash
cd backend
dotnet ef database update
```

If `dotnet ef` is missing:

```bash
dotnet tool install --global dotnet-ef --version 8.0.11
```

Migration source lives under `backend/Data/Migrations/` (generated even if MySQL was offline at build time).

### 3. Run the API

```bash
cd backend
dotnet restore
dotnet run --launch-profile http
```

- HTTP: **[http://localhost:5247](http://localhost:5247)** (Swagger at `/swagger`)
- HTTPS profile: **[https://localhost:7031](https://localhost:7031)**
- CORS allows Vite origin `http://localhost:5173` in Development

**Seed accounts:**


| Email                 | Password    | Role  |
| --------------------- | ----------- | ----- |
| `admin@nursery.local` | `Admin123!` | Admin |
| `staff@nursery.local` | `Staff123!` | User  |




### Main API routes


| Method              | Path                              | Roles                                    |
| ------------------- | --------------------------------- | ---------------------------------------- |
| POST                | `/api/auth/login`                 | anonymous                                |
| GET/POST/PUT/DELETE | `/api/species`                    | GET any auth; mutations Admin            |
| GET/POST/PUT/DELETE | `/api/batches`                    | GET any auth; create/update/delete Admin |
| PATCH               | `/api/batches/{id}/health`        | Admin, User                              |
| POST                | `/api/batches/{id}/mark-for-sale` | Admin (only if sale-ready)               |
| GET                 | `/api/waterings/due`              | Admin, User                              |
| POST                | `/api/waterings`                  | Admin, User                              |
| GET                 | `/api/dashboard`                  | Admin, User (summary counts)             |
| GET                 | `/api/dashboard/summary`          | due list + readiness counts              |
| GET                 | `/api/dashboard/readiness`        | per-batch readiness rules                |




## Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

API base URL is set via Vite env:

- File: `frontend/.env` (see `.env.example`)
- Variable: `VITE_API_URL` (defaults in code to `http://localhost:5247` if unset)

Example:

```env
VITE_API_URL=http://localhost:5247
```

If you run the API on another port (e.g. `5080` or `7031`), update `VITE_API_URL` and restart `npm run dev`.

### UI pages


| Route       | Who   | Purpose                                                     |
| ----------- | ----- | ----------------------------------------------------------- |
| `/login`    | all   | JWT login; stores token + role                              |
| `/`         | auth  | Dashboard summary counts                                    |
| `/species`  | Admin | Species CRUD                                                |
| `/batches`  | auth  | Batches + readiness badge; Admin create/edit / mark ForSale |
| `/watering` | auth  | Due/overdue queue + record watering                         |




### Assumed API contract

- `POST /api/auth/login` → `{ token, email, role }`
- `GET|POST|PUT|DELETE /api/species`
- `GET|POST|PUT /api/batches`, `POST /api/batches/{id}/mark-for-sale`
- `GET /api/waterings/due`, `POST /api/waterings`
- `GET /api/dashboard` → `{ overdueWaterings, saleReadyBatches, growingBatches }`



## Quick start order

1. Start MySQL, create DB `plant_nursery`, set connection string password.
2. Run API (`dotnet run --launch-profile http` in `backend/`) — migrates + seeds on start.
3. Run frontend (`npm run dev` in `frontend/`).
4. Log in as admin or staff and exercise watering + readiness flows.



## Sale readiness (server rules)

A batch is sale-ready when **all** are true:

1. Age ≥ species `MinDaysBeforeSale`
2. `HealthStatus == Healthy`
3. Watering is not overdue (last watering within interval, or planted recently and not yet due)
4. `Status` is `Growing` or `ForSale` (not `SoldOut`)

