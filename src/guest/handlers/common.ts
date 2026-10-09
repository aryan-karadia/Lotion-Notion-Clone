import type { Note } from "../../stores/NotesSlice";
import type { GuestNotesStorage, GuestRequest, GuestResponse } from "./types.ts";

export const json = (statusCode: number, value: unknown): GuestResponse => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});

export const methodOf = (event: GuestRequest) =>
  (event.httpMethod || event.method || "GET").toUpperCase();

export const parseBody = (event: GuestRequest): unknown => {
  if (event.body === undefined || event.body === null || event.body === "") return {};
  if (typeof event.body !== "string") return event.body;
  return JSON.parse(event.body);
};

/**
 * A guest request is deliberately different from a remote request: it has no
 * bearer/access token and must carry an explicit guest session identity.
 */
export const requireGuest = (event: GuestRequest) => {
  const session = event.session;
  const headers = event.headers || {};
  const token = headers["Access-token"] || headers["access-token"] || headers.authorization;
  if (!session || session.mode !== "guest" || !session.email.trim() || token) {
    return json(401, { message: "Unauthorized" });
  }
  return undefined;
};

export const readNotes = (storage: GuestNotesStorage) => {
  try {
    return storage.read();
  } catch (cause) {
    return { error: cause };
  }
};

export const isNote = (value: unknown): value is Note => {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<Note>;
  return typeof note.Content === "string" &&
    typeof note.Title === "string" &&
    typeof note.email === "string" &&
    typeof note.when === "string" &&
    Number.isFinite(note.id);
};

export const validId = (value: unknown): number | undefined => {
  const id = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof id === "number" && Number.isFinite(id) ? id : undefined;
};
