import type { Note } from "../stores/NotesSlice";
import { createGuestNotesApi as createHandlerGuestNotesApi } from "../guest/guestNotesApi.ts";

export type Session = {
  mode: "google" | "guest";
  email: string;
  token?: string;
};

export type NotesApiErrorCode =
  | "unauthorized"
  | "network"
  | "http"
  | "invalid_response"
  | "storage"
  | "configuration";

export class NotesApiError extends Error {
  readonly code: NotesApiErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    code: NotesApiErrorCode,
    message: string,
    status?: number,
    cause?: unknown,
  ) {
    super(message);
    this.name = "NotesApiError";
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

export type NotesResult = { notes: Note[]; count: number };

export interface NotesApi {
  getNotes(session: Session): Promise<NotesResult>;
  saveNote(session: Session, note: Note): Promise<Note>;
  deleteNote(session: Session, noteId: number): Promise<number>;
}

export interface GuestNotesStorage {
  read(): NotesResult;
  write(result: NotesResult): void;
  remove(noteId: number): void;
  reset(): void;
}

const remoteUrls = {
  get: "https://oeurpvedfschzmurcc5abpypcq0jdtbn.lambda-url.ca-central-1.on.aws/",
  save: "https://oxvt53qsm3qxtxctk3qo5rmed40efknj.lambda-url.ca-central-1.on.aws/",
  delete: "https://4hzre52ywo56kfhpjxgtfggjpq0zfkln.lambda-url.ca-central-1.on.aws/",
} as const;

const parseRemoteError = (status: number, body: unknown) => {
  const message =
    body && typeof body === "object" && "message" in body
      ? String((body as { message: unknown }).message)
      : "Notes request failed";
  return new NotesApiError(
    status === 401 || status === 403 ? "unauthorized" : "http",
    message,
    status,
  );
};

const request = async (url: string, init: RequestInit): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw new NotesApiError("network", "Unable to reach notes service", undefined, cause);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    if (!response.ok) throw parseRemoteError(response.status, undefined);
    throw new NotesApiError("invalid_response", "Notes service returned invalid JSON", response.status, cause);
  }
  if (!response.ok) throw parseRemoteError(response.status, body);
  return body;
};

const requireGoogleSession = (session: Session) => {
  if (session.mode !== "google" || !session.token) {
    throw new NotesApiError("unauthorized", "A Google session is required");
  }
};

export const remoteNotesApi: NotesApi = {
  async getNotes(session) {
    requireGoogleSession(session);
    const data = (await request(remoteUrls.get, {
      method: "GET",
      headers: { "Content-Type": "application/json", email: session.email, "Access-token": session.token },
    })) as { notes?: unknown; count?: unknown };
    if (!Array.isArray(data.notes)) throw new NotesApiError("invalid_response", "Notes response did not contain notes");
    const notes = data.notes.map((note) => {
      const value = note as Note;
      return { ...value, id: typeof value.id === "string" ? parseInt(value.id, 10) : value.id };
    });
    return { notes, count: typeof data.count === "number" ? data.count : notes.length };
  },

  async saveNote(session, note) {
    requireGoogleSession(session);
    await request(remoteUrls.save, {
      method: "POST",
      headers: { "Content-Type": "application/json", email: session.email, "Access-token": session.token },
      body: JSON.stringify({ ...note, email: session.email, id: String(note.id) }),
    });
    return note;
  },

  async deleteNote(session, noteId) {
    requireGoogleSession(session);
    await request(remoteUrls.delete, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", email: session.email, "Access-token": session.token },
      body: JSON.stringify({ id: String(noteId) }),
    });
    return noteId;
  },
};

export const createGuestNotesApi = (storage: GuestNotesStorage): NotesApi => ({
  async getNotes(session) {
    if (session.mode !== "guest") throw new NotesApiError("unauthorized", "A guest session is required");
    try { return storage.read(); } catch (cause) { throw new NotesApiError("storage", "Unable to read guest notes", undefined, cause); }
  },
  async saveNote(session, note) {
    if (session.mode !== "guest") throw new NotesApiError("unauthorized", "A guest session is required");
    try {
      const result = storage.read();
      storage.write({ notes: [...result.notes.filter((item) => item.id !== note.id), note], count: result.notes.some((item) => item.id === note.id) ? result.count : result.count + 1 });
      return note;
    } catch (cause) { throw new NotesApiError("storage", "Unable to save guest note", undefined, cause); }
  },
  async deleteNote(session, noteId) {
    if (session.mode !== "guest") throw new NotesApiError("unauthorized", "A guest session is required");
    try { storage.remove(noteId); return noteId; } catch (cause) { throw new NotesApiError("storage", "Unable to delete guest note", undefined, cause); }
  },
});

// Guest storage is supplied by the guest-mode owner; keeping it out of this seam
// prevents authenticated requests from ever falling back to browser storage.
export const guestNotesApi = (storage: GuestNotesStorage) => createGuestNotesApi(storage);

export const createNotesApi = (
  session: Session,
  guestStorage?: GuestNotesStorage,
): NotesApi => {
  if (session.mode === "google") return remoteNotesApi;
  if (!guestStorage) {
    throw new NotesApiError("configuration", "Guest notes storage is not configured");
  }
  return createHandlerGuestNotesApi(guestStorage, { latencyMs: 0 });
};
