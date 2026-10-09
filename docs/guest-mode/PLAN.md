# Guest Mode Execution Plan

## Goal
Allow visitors to try the note-taking experience without Google OAuth while keeping authenticated data and backend access isolated and secure.

## Phases

1. **Define behavior and boundaries** — Agree on guest capabilities, persistence lifetime, upgrade/sign-in behavior, UI copy, and explicit exclusions (no access to authenticated notes or protected APIs). Document acceptance cases.
2. **Design the guest session** — Choose the guest identity/state model, storage and reset semantics, route-guard behavior, and migration strategy. Confirm that guest requests cannot reach user-scoped Lambda/DynamoDB operations.
3. **Implement the client flow** — Add the entry point, guest session state, route handling, note CRUD against guest-only storage, empty/loading/error states, and sign-in/exit controls. Preserve the existing authenticated flow unchanged.
4. **Harden integration** — Validate auth boundaries, token/header handling, storage namespacing, data-clearing behavior, refresh/new-tab behavior, and production configuration. Add focused tests for isolation and regressions.
5. **Release and observe** — Run the test/build checks, perform an authenticated-versus-guest smoke test in a deployed preview, update user-facing documentation, and monitor errors and conversion/exit signals after rollout.

## Ownership and merge order

- **Agent 0 / coordinator:** Owns requirements, acceptance cases, sequencing, integration, and final sign-off.
- **Frontend owner:** Implements guest entry, state, routes, editor/list UX, and client-side persistence.
- **Backend/security owner:** Reviews and, if required, implements guest boundary enforcement and infrastructure/configuration changes; owns the threat-model checks.
- **QA/docs owner:** Adds focused coverage, executes the smoke-test matrix, and updates README or operational notes.

Merge in this order: behavior/design decision → backend/security contract → frontend implementation → QA/docs and release checks. Agent 0 resolves conflicts and merges only after each preceding contract is verified.

## Exit criteria

- A visitor can enter guest mode and create, edit, view, and delete notes without OAuth.
- Guest data is clearly identified, isolated from every authenticated account, and reset according to the documented lifetime; no guest action reads or writes another user's data.
- Sign-in/exit behavior is explicit, recoverable, and does not silently discard data outside the documented policy.
- Protected routes and authenticated CRUD behavior remain unchanged and pass regression tests.
- Focused unit/integration coverage and the production build pass; deployed preview smoke tests cover guest and authenticated paths on refresh and logout.
- User-facing documentation explains guest limitations, persistence, privacy, and how to sign in.
