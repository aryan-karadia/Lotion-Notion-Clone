import type { GuestNotesStorage, Session } from "../../api/notesApi";

export const GUEST_SESSION_KEY = "lotion:guest:v1:session";
export const DEFAULT_GUEST_EMAIL = "guest@lotion.local";

export type GuestSessionRecord = {
  mode: "guest";
  email: string;
};

export type GuestSessionOptions = {
  email?: string;
  storage?: GuestNotesStorage;
  fresh?: boolean;
};

let guestNotesStorage: GuestNotesStorage | undefined;

export const setGuestNotesStorage = (storage: GuestNotesStorage | undefined) => {
  guestNotesStorage = storage;
};

export const getGuestNotesStorage = () => guestNotesStorage;

const readRecord = (): GuestSessionRecord | null => {
  const value = sessionStorage.getItem(GUEST_SESSION_KEY);
  if (!value) return null;
  try {
    const record = JSON.parse(value) as Partial<GuestSessionRecord>;
    if (record.mode === "guest" && typeof record.email === "string" && record.email) {
      return { mode: "guest", email: record.email };
    }
  } catch {
    // A malformed session is equivalent to no guest session.
  }
  sessionStorage.removeItem(GUEST_SESSION_KEY);
  return null;
};

export const getGuestSession = (): Session | null => {
  const record = readRecord();
  return record ? { mode: "guest", email: record.email } : null;
};

export const startGuestSession = ({
  email = DEFAULT_GUEST_EMAIL,
  storage,
  fresh = true,
}: GuestSessionOptions = {}): Session => {
  if (!email) throw new Error("A guest session email is required");
  if (fresh) storage?.reset();
  const session: GuestSessionRecord = { mode: "guest", email };
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  return { mode: "guest", email };
};

export const endGuestSession = (
  storage?: GuestNotesStorage,
  options: { wipe?: boolean } = {},
): void => {
  if (options.wipe) storage?.reset();
  sessionStorage.removeItem(GUEST_SESSION_KEY);
};

export const isGuestSession = (session: { mode?: string | null } | null | undefined) =>
  session?.mode === "guest";
