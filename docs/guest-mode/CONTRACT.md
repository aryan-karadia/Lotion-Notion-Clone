# Notes API and guest-mode contract

## Session

The seam accepts:

```ts
type Session = { mode: "google" | "guest"; email: string; token?: string }
```

`google` requires a non-empty OAuth access token and is the only mode allowed to
call the Lambda URLs. `guest` must never send a token or call a Lambda URL.
Guest callers use a stable non-account email marker supplied by the session
owner (it is an application identity, not an authenticated address).

## API

`NotesApi` exposes:

- `getNotes(session) -> { notes, count }`
- `saveNote(session, note) -> note`
- `deleteNote(session, noteId) -> noteId`

Notes retain the existing `{ Content, Title, email, when, id }` shape. Remote
IDs are strings on the wire and numbers in the client. Remote save sends the
complete note with `email` from the session and a string ID. Remote delete
retains the current `{ id: String(noteId) }` body and headers, so authenticated
behavior is not changed by this seam.

`NotesApiError` is the explicit error model. Its `code` is one of
`unauthorized`, `network`, `http`, `invalid_response`, `storage`, or
`configuration`; HTTP failures also carry `status`, and underlying failures
are available as `cause`. Consumers should use `code` for behavior and
`message` for display/logging.

## Implementations and factory

`remoteNotesApi` is the existing Lambda implementation. `createGuestNotesApi`
adapts a guest-only `GuestNotesStorage`; it performs CRUD locally and rejects a
non-guest session. `guestNotesApi(storage)` is the named guest implementation
factory. `createNotesApi(session, guestStorage)` selects the remote
implementation for Google and the guest implementation when guest storage is
provided. A guest session without storage fails closed with `configuration`;
it cannot accidentally fall through to remote.

## Guest storage schema and lifecycle

The storage owner must persist a guest-only composite-key object under
`lotion:guest:v1:table:Notes`:

```ts
{
  "guest@lotion.local": {
    "1": { "email": "guest@lotion.local", "id": 1, "Title": "...", "Content": "...", "when": "..." }
  }
}
```

Reads validate the nested composite-key shape, normalize numeric string IDs,
recalculate `count`, and treat missing or corrupt data as an empty store.
`reset()` removes the guest key and is required on explicit guest exit and when
starting a fresh guest session. Guest data is not copied into, merged with, or
used as a fallback for a Google session. Browser persistence and its lifetime
are owned by the guest-mode frontend work; this seam only defines the adapter
boundary.
