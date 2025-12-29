# Migration Plan to Full Monorepo Structure

Goal: Move existing `Front-end/` user portal into `apps/user-portal` and centralize shared code without breaking current workflows.

## Phases
### Phase 1: Scaffold (DONE)
- Added root `package.json` with workspaces.
- Created `apps/admin-portal` and shared packages (`ui`, `graphql`, `auth`, `utils`).

### Phase 2: Extract Shared Code
- Identify reusable components in `Front-end/src/components` (buttons, layout pieces).
- Move them into `packages/ui` and refactor imports.
- Extract Apollo client setup into `packages/graphql` (align headers, error handling).
- Extract date/period helpers into `packages/utils`.

### Phase 3: Move User Portal
- Create `apps/user-portal` directory.
- Copy current `Front-end/src` into new location preserving git history (use `git mv`).
- Update imports pointing to shared packages.
- Remove old `Front-end/` after verification.

### Phase 4: Codegen & Typing
- Introduce GraphQL code generation config at root (`codegen.yml`).
- Generate types per app output target.

### Phase 5: CI/CD Adjustments
- Update build pipeline to run `pnpm build:admin` and `pnpm --filter user-portal build`.
- Publish as separate deployments (e.g. `admin.example.com`, `app.example.com`).

### Phase 6: Hardening
- Add role-based route guards in both portals.
- Add shared error boundary component.
- Implement impersonation flows.

## Notes
- Keep changes incremental: migrate smallest shared module first.
- Avoid breaking environment variables; mirror existing `.env` keys when moving Apollo config.
- Run smoke tests in user portal after each extraction.

## Rollback Strategy
If a shared extraction breaks the user portal, revert the specific commit and retry with smaller granularity.

