# UB Karaoke

UB Karaoke is a comprehensive platform designed for discovering and booking karaoke venues. It features a modern React frontend and a robust NestJS backend.

## Documentation

Comprehensive system and requirement documentation can be found in the `docs` directory:

- [System Design Document](docs/system_design.md)
- [Requirement Documentation](docs/requirements.md)
- [Full Documentation (Word/Docx)](docs/ub_karaoke_documentation.docx)

## Developer Guide

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v18+ recommended
- **npm** or **yarn**
- **Docker & Docker Compose**: For running database and Redis services easily.
- **PostgreSQL**: (Optional if running locally without Docker)
- **Redis**: (Optional if running locally without Docker)

### Project Structure

- `api`: NestJS backend application.
- `ui`: React + Vite frontend application.
- `docs`: Project documentation.

### Getting Started

#### 1. Environment Setup

**API:**
1. Navigate to the `api` directory:
   ```bash
   cd api
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. **Important:** The `docker-compose.yml` configures PostgreSQL on port **5433** to avoid conflicts with local installations.
   - If you run the API locally (via `npm run start:dev`) and use the Docker database, update `api/.env`:
     ```properties
     DATABASE_PORT=5433
     ```

#### 2. Start Infrastructure (Docker)

Start the database and Redis services:
```bash
cd api
docker-compose up -d
```
This starts:
- Postgres: `localhost:5433` (mapped from 5432)
- Redis: `localhost:6379`

#### 3. Install Dependencies

**API:**
```bash
cd api
npm install
```

**UI:**
```bash
cd ..
cd ui
npm install
```

#### 4. Database Seeding

Initialize the database with seed data:
```bash
cd ../api
npm run seed
```

#### 5. Running the Application

You can run the API and UI in separate terminals.

**API (Backend):**
```bash
cd api
npm run start:dev
```
- Server: `http://localhost:3001`
- Swagger Docs: `http://localhost:3001/api`

**UI (Frontend):**
```bash
cd ui
npm run dev
```
- Application: `http://localhost:5173`

### Development Notes

- **API Testing**: `npm run test` or `npm run test:e2e` in `api` directory.
- **Linting**: `npm run lint` in both directories.
- **Entity Standards**: All core entities use `isActive` (boolean) for status and include `createdBy`/`updatedBy` columns for audit tracking. Hierarchical deactivation is enforced at the service layer (e.g., deactivating an organization hides its venues).
