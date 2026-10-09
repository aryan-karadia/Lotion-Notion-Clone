# Guest Mode Reconnaissance

## Scope

This document records the existing authentication, routing, Redux, API, Lambda, and
build/test behavior before introducing guest mode. Line references are relative to
the current repository revision.

## Frontend authentication and session lifecycle

- Google OAuth is initialized with `REACT_APP_GOOGLE_CLIENT_ID` in
  [`src/index.js:7-18`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/index.js:7).
- [`App`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/App.js:16) uses
  `useGoogleLogin`; the callback stores `access_token` in React state and
  `sessionStorage` ([`src/App.js:22-39`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/App.js:22)).
- The profile request is sent to Google userinfo with the token in the URL and a
  malformed/redacted Authorization value; successful responses use `email` and
  `name` ([`src/App.js:41-56`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/App.js:41)).
- User identity is restored independently from `sessionStorage["user"]` by
  [`UserSlice`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/UserSlice.ts:5).
- Logout clears React token state, invokes `logoutUser` and `googleLogout`, and
  removes `access_token` and `user` from session storage
  ([`src/App.js:62-67`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/App.js:62),
  [`src/stores/UserSlice.ts:27-37`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/UserSlice.ts:27)).
- There is no refresh-token, expiration, revocation, backend logout, or Redux
  notes reset. The authenticated router unmounts, but notes remain in Redux memory
  until replaced or the page is reloaded.

## Redux and route flow

- The store has only `user` and `notes` reducers
  ([`src/stores/store.ts:5-8`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/store.ts:5)).
- User state is `{ email: string | null, name: string | null }`
  ([`src/stores/UserSlice.ts:5-7`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/UserSlice.ts:5)).
- Note state uses `{ Content, Title, email, when, id }`, with frontend `id` typed
  as a number ([`src/stores/NotesSlice.ts:4-10`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:4)).
- `fetchNotes`, `saveNoteAsync`, and `deleteNoteAsync` are
  `createAsyncThunk` thunks; `createNoteFrontend` inserts a blank note before save
  ([`src/stores/NotesSlice.ts:28-176`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:28)).
- Fetch replaces notes/count and derives `nextId` as max numeric ID plus one
  ([`src/stores/NotesSlice.ts:35-78`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:35)).
- Save and delete update Redux only after fulfilled responses
  ([`src/stores/NotesSlice.ts:214-266`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:214)); only
  new-note creation is optimistic/frontend-only
  ([`src/components/Layout.jsx:39-49`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/components/Layout.jsx:39)).
- The app renders authenticated routes when `user.email !== null`
  ([`src/App.js:16-20`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/App.js:16)).
  `ProtectedRoute` and `ProtectedNoteRoute` redirect unauthenticated users to
  `/` ([`src/routes/ProtectedRoutes.jsx:7-28`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/routes/ProtectedRoutes.jsx:7)).
- `Layout` fetches when email/token changes
  ([`src/components/Layout.jsx:17-30`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/components/Layout.jsx:17)).
  Note routes redirect to `/Notes` when the requested note is absent
  ([`src/pages/Edit.jsx:115-117`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/pages/Edit.jsx:115)).

## Existing frontend API contracts

All three calls use `Content-Type: application/json`, `email`, and
`Access-token` headers.

| Operation | Request | Expected success |
|---|---|---|
| GET notes | GET Lambda URL; code also expects a JSON body containing `email` | `{ notes: [], count, message }`; IDs are normalized to numbers |
| Save note | POST JSON note; thunk overwrites `email` and stringifies `id` | Lambda JSON is logged; Redux keeps the original note |
| Delete note | DELETE JSON `{ id: String(noteId) }` | Lambda JSON is logged; thunk returns numeric ID |

The URLs and handling are in [`src/stores/NotesSlice.ts:35-172`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:35).
Non-2xx responses become generic client errors: `"Failed to fetch notes"`,
`"Failed to save note"`, or `"Failed to delete note"`.

## Lambda contracts

### `get-notes`

[`functions/get-notes/main.py`](/Users/aryankaradia/projects/Lotion-Notion-Clone/functions/get-notes/main.py:9)
unconditionally parses `event["body"]`, reads `email` and `access-token`, and
rejects a missing token with 401 and `{"message":"Unauthorized"}`. It calls the
Google People API, compares the returned email with `body["email"]`, then queries
DynamoDB using the header email. Success is 200 with
`{"notes":[...],"count":...,"message":"get note success"}`. Exceptions return
500 with the exception message; non-GET requests return 405 with
`{"message":"Method Not Allowed"}`.

### `save-note`

[`functions/save-note/main.py`](/Users/aryankaradia/projects/Lotion-Notion-Clone/functions/save-note/main.py:8)
accepts POST, parses the note body, and checks `access-token`. It validates the
Google email against `body["email"]`, writes the entire body with DynamoDB
`put_item`, and returns 200 with `{"message":"save note success"}`. Missing or
invalid auth returns 401; DynamoDB exceptions return 500 with
`{"message":"custom error<exception>"}`; other methods return 405.

### `delete-note`

[`functions/delete-note/main.py`](/Users/aryankaradia/projects/Lotion-Notion-Clone/functions/delete-note/main.py:8)
parses a JSON body and requires `email`, `access-token`, and `id`. It validates
Google email against `body["email"]`, deletes `{email: header email, id: body id}`,
and returns 200 with `{"message":"delete note success"}`. Missing/invalid auth is
401, DynamoDB exceptions are 500, and there is no explicit method guard. The
current frontend sends no body `email`, so this path can fail before the Lambda
try block.

The infrastructure declares the DynamoDB sort key as a **string**, not a number,
in [`infra/main.tf:201-226`](/Users/aryankaradia/projects/Lotion-Notion-Clone/infra/main.tf:201).
Lambda URLs are publicly callable (`authorization_type = "NONE"`); application
Google validation is the intended protection
([`infra/main.tf:108-194`](/Users/aryankaradia/projects/Lotion-Notion-Clone/infra/main.tf:108)).

## IDs, timestamps, errors, and Google assumptions

- IDs are generated on the client as max existing numeric ID plus one; there is
  no server-side or collision-safe generation
  ([`src/stores/NotesSlice.ts:56-74`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:56)).
- New-note timestamps use `new Date().toLocaleString()`, with edit defaults using
  an `en-US` locale format
  ([`src/stores/NotesSlice.ts:127-139`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:127),
  [`src/pages/Edit.jsx:19-25`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/pages/Edit.jsx:19)).
- The frontend assumes `codeResponse.access_token` is a usable Google token and
  sends it as `Access-token` ([`src/App.js:23-30`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/App.js:23),
  [`src/stores/NotesSlice.ts:40-43`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/stores/NotesSlice.ts:40)).
- Source contains redacted/malformed `"******"` Authorization construction in
  the profile request and all Lambda Google calls. The frontend requests Drive
  metadata scope but the backend uses People API; no People API scope is explicit.
- Tokens are placed in the Google profile URL query string. There is no expiry,
  issuer, audience, nonce, or signature validation.

## Tests, lint, and build

- There are no existing test files. [`src/setupTests.js`](/Users/aryankaradia/projects/Lotion-Notion-Clone/src/setupTests.js:1)
  only imports `@testing-library/jest-dom`.
- `package.json` provides `npm start`, `npm test`, `npm run build`, and
  `npm run eject`; ESLint extends `react-app` and `react-app/jest`, with no
  separate lint script ([`package.json`](/Users/aryankaradia/projects/Lotion-Notion-Clone/package.json:21)).

## Prompt assumptions corrected

1. Delete-note requires a JSON body with `id` and backend `email`; it is not a
   query-parameter-only contract.
2. Get-notes parses a body even for GET and reads `body["email"]`.
3. The real sort key is configured as a string; frontend normalization to numbers
   is inconsistent with save/delete and DynamoDB.
4. Save/delete are not optimistic; only blank-note creation is frontend-only.
5. IDs are client-generated and sequential, not server-generated.
6. Logout does not clear the Redux notes slice.
7. Lambda URLs are unauthenticated at the AWS layer and rely on application auth.
8. The source's Google Authorization values are redacted/malformed, so parity
   should preserve observed behavior without changing the remote path as part of
   guest work.
