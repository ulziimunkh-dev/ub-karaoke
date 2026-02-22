# System Versioning Guide

This document outlines the versioning strategy for the UB Karaoke application, covering the API, database schema, and frontend releases.

## 1. API Versioning

We use **URI-based versioning** in the NestJS backend to ensure that changes to the API do not break existing clients.

### How to use
The default version is `v1`. All new endpoints should be accessible under the `/v1/` prefix.

**Global Configuration (`main.ts`):**
```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

**Controller Level Versioning:**
To specify a version for a controller or a specific route:
```typescript
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {}
```

## 2. Database Schema Versioning (Migrations)

We use **TypeORM Migrations** to manage database schema changes. This replaces `synchronize: true` for production-grade reliability.

### capturring Changes
When you modify an `@Entity()`, you must generate a migration to reflect those changes in the database.

**Generate a migration:**
```bash
npm run migration:generate -- src/database/migrations/YourMigrationName
```

**Run migrations:**
```bash
npm run migration:run
```

**Revert a migration:**
```bash
npm run migration:revert
```

### Best Practices
- Always review the generated migration file before committing.
- Do not use `synchronize: true` in production environments.
- Each migration should be atomic and reversible.

## 3. Semantic Versioning (SemVer)

The project follows [Semantic Versioning](https://semver.org/).

- **MAJOR (x.0.0)**: Breaking changes (e.g., API v2, major database refactoring).
- **MINOR (0.x.0)**: New features (e.g., adding a new module).
- **PATCH (0.0.x)**: Bug fixes and minor improvements.

### Versioning Files
Update the `version` field in the following files before a release:
- `api/package.json`
- `ui/package.json`

## 4. Release Process
1. Bump the version in `package.json`.
2. Generate any necessary database migrations.
3. Commit and push changes.
4. Tag the commit in Git:
   ```bash
   git tag -a v1.0.0 -m "Release description"
   git push origin v1.0.0
   ```
