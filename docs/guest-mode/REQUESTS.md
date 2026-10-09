# Seam follow-up

- The guest-mode frontend owner must provide a `GuestNotesStorage` adapter when
  constructing guest requests (or add a session-scoped API dependency to the
  Redux thunks). `createNotesApi` intentionally fails closed when a guest
  session has no adapter; it must not default to remote Lambda calls.

- UI/storage handoff: `src/components/guest/guestStorage.ts` exports
  `createGuestNotesStorage`, `guestNotesStorage`, `ensureGuestSeeded`, and
  `resetGuestDemoData`. The guest session owner should use this adapter (or
  preserve its equivalent validation and seed semantics) when wiring the
  Redux/API seam. The login button emits `lotion:guest-login` by default;
  handle that event or pass `GuestLoginButton` an explicit callback.
