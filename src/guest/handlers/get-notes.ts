import { json, methodOf, readNotes, requireGuest } from "./common.ts";
import type { GuestHandler } from "./types.ts";

export const getNotes: GuestHandler = (event, storage) => {
  if (methodOf(event) !== "GET") return json(405, { message: "Method Not Allowed" });
  const unauthorized = requireGuest(event);
  if (unauthorized) return unauthorized;
  const result = readNotes(storage);
  if ("error" in result) return json(500, { message: String(result.error) });
  return json(200, { notes: result.notes, count: result.notes.length, message: "get note success" });
};

export default getNotes;
