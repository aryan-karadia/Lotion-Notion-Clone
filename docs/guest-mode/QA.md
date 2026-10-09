# Guest mode QA

Automated coverage lives beside the implementation:

- `src/api/__tests__/notesApi.test.ts` checks the shared NotesApi shape, guest
  CRUD/persistence, fail-closed construction, and remote request headers/ID
  normalization. Guest calls assert that `fetch` is never invoked.
- `src/components/guest/__tests__/guestStorage.test.ts` checks versioned
  persistence, count recalculation, string-ID normalization, and corrupt-data
  recovery.
- `src/guest/session/__tests__/session.test.ts` checks fresh reset, session
  restore, token absence, and explicit wipe on exit.

Run with `npm test -- --watchAll=false`.

## Manual browser checklist

- Open the app in a normal window, enter guest mode, and confirm the seeded
  notes render; create, edit, and delete a note, then reload and confirm the
  result persists.
- Use DevTools Network (including Fetch/XHR) while entering guest mode and
  performing CRUD. Confirm no Lambda request and no access token is sent.
- Open a private/incognito window and repeat the guest flow. Confirm it starts
  with the expected seed and does not expose data from a normal window.
- Open two tabs in the same browser profile. Verify the documented persistence
  behavior after reload and after ending one guest session; do not assume
  cross-tab live synchronization unless explicitly implemented.
- Exercise storage pressure (fill local storage or use DevTools overrides).
  Confirm the UI reports a recoverable failure and does not claim a write
  succeeded when quota is exceeded.
- Corrupt `lotion:guest:v1:table:Notes` in DevTools Application > Local Storage
  (invalid JSON, unknown version, malformed notes). Reload and confirm the app
  recovers to an empty/reset-safe state without a crash.
- Start guest mode, sign out, then sign in with Google. Confirm guest notes are
  not shown or sent as Google notes; repeat in the reverse order to verify
  account data is not shown in guest mode.
