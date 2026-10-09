import { json, methodOf, parseBody, requireGuest, validId } from "./common.ts";
import type { GuestHandler } from "./types.ts";

export const deleteNote: GuestHandler = (event, storage) => {
  if (methodOf(event) !== "DELETE") return json(405, { message: "Method Not Allowed" });
  const unauthorized = requireGuest(event);
  if (unauthorized) return unauthorized;
  let body: unknown;
  try {
    body = parseBody(event);
  } catch {
    return json(400, { message: "Invalid request body" });
  }
  const id = validId(body && typeof body === "object" ? (body as { id?: unknown }).id : undefined);
  if (id === undefined) return json(400, { message: "Invalid note id" });
  try {
    storage.remove(id);
    return json(200, { message: "delete note success" });
  } catch (cause) {
    return json(500, { message: String(cause) });
  }
};

export default deleteNote;
