import type { Note } from "../stores/NotesSlice";
import {
  NotesApiError,
  type GuestNotesStorage,
  type NotesApi,
  type Session,
} from "../api/notesApi.ts";
import { deleteNote as deleteNoteHandler } from "./handlers/delete-note.ts";
import { getNotes as getNotesHandler } from "./handlers/get-notes.ts";
import { saveNote as saveNoteHandler } from "./handlers/save-note.ts";
import type { GuestResponse } from "./handlers/types.ts";

export type GuestNotesApiOptions = {
  /** Simulates the normal local guest request delay. Set to zero in tests. */
  latencyMs?: number;
};

const wait = (milliseconds: number) =>
  milliseconds > 0 ? new Promise<void>((resolve) => setTimeout(resolve, milliseconds)) : Promise.resolve();

const responseError = (response: GuestResponse): NotesApiError => {
  let message = "Guest notes request failed";
  try {
    const body = JSON.parse(response.body) as { message?: unknown };
    if (body.message) message = String(body.message);
  } catch {
    // Keep the useful generic message for a malformed handler response.
  }
  return new NotesApiError(
    response.statusCode === 401 || response.statusCode === 403 ? "unauthorized" :
      response.statusCode >= 500 ? "storage" : "http",
    message,
    response.statusCode,
  );
};

const requireGuest = (session: Session) => {
  if (session.mode !== "guest" || !session.email.trim() || session.token) {
    throw new NotesApiError("unauthorized", "A guest session is required");
  }
};

const invoke = async (
  handler: (event: Parameters<typeof getNotesHandler>[0], storage: GuestNotesStorage) => GuestResponse,
  event: Parameters<typeof getNotesHandler>[0],
  storage: GuestNotesStorage,
  latencyMs: number,
) => {
  await wait(latencyMs);
  let response: GuestResponse;
  try {
    response = handler(event, storage);
  } catch (cause) {
    throw new NotesApiError("storage", "Unable to access guest notes", undefined, cause);
  }
  if (response.statusCode < 200 || response.statusCode >= 300) throw responseError(response);
  return response;
};

export const createGuestNotesApi = (
  storage: GuestNotesStorage,
  options: GuestNotesApiOptions = {},
): NotesApi => {
  const latencyMs = Math.max(0, options.latencyMs ?? 180);
  return {
    async getNotes(session) {
      requireGuest(session);
      const response = await invoke(getNotesHandler, { httpMethod: "GET", session }, storage, latencyMs);
      try {
        const data = JSON.parse(response.body) as { notes?: unknown; count?: unknown };
        if (!Array.isArray(data.notes)) throw new Error("Notes response did not contain notes");
        return {
          notes: data.notes as Note[],
          count: typeof data.count === "number" ? data.count : data.notes.length,
        };
      } catch (cause) {
        if (cause instanceof NotesApiError) throw cause;
        throw new NotesApiError("invalid_response", "Guest notes response was invalid", undefined, cause);
      }
    },
    async saveNote(session, note) {
      requireGuest(session);
      const guestNote = { ...note, email: session.email };
      await invoke(
        saveNoteHandler,
        { httpMethod: "POST", session, body: JSON.stringify(guestNote) },
        storage,
        latencyMs,
      );
      return guestNote;
    },
    async deleteNote(session, noteId) {
      requireGuest(session);
      await invoke(
        deleteNoteHandler,
        { httpMethod: "DELETE", session, body: JSON.stringify({ id: String(noteId) }) },
        storage,
        latencyMs,
      );
      return noteId;
    },
  };
};

export const guestNotesApi = createGuestNotesApi;
export default guestNotesApi;
