import { isNote, json, methodOf, parseBody, requireGuest } from "./common.ts";
import type { GuestHandler } from "./types.ts";

export const saveNote: GuestHandler = (event, storage) => {
  if (methodOf(event) !== "POST") return json(405, { message: "Method Not Allowed" });
  const unauthorized = requireGuest(event);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try {
    body = parseBody(event);
  } catch {
    return json(400, { message: "Invalid request body" });
  }
  if (!isNote(body) || body.email !== event.session!.email) {
    return json(400, { message: "Invalid note" });
  }
  const note = body;
  try {
    const current = storage.read();
    const notes = [...current.notes.filter((item) => item.id !== note.id), note];
    storage.write({ notes, count: notes.length });
    return json(200, { message: "save note success" });
  } catch (cause) {
    return json(500, { message: `custom error${String(cause)}` });
  }
};

export default saveNote;
