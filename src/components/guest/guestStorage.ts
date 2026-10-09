import type { Note } from "../../stores/NotesSlice";
import type { GuestNotesStorage, NotesResult } from "../../api/notesApi";
import { LocalDynamoTable, type StorageLike } from "../../guest/storage/LocalDynamoTable.ts";

export const GUEST_STORAGE_KEY = "lotion:guest:v1:table:Notes";
const GUEST_EMAIL = "guest@lotion.local";

const seededNotes: Note[] = [
  {
    id: 1,
    Title: "Welcome to Lotion",
    Content: "This private demo is yours to explore.\n\nCreate, edit, and delete notes without signing in.",
    email: "guest@lotion.local",
    when: "October 8, 2026, 9:00 AM",
  },
  {
    id: 2,
    Title: "Weekend ideas",
    Content: "• Try the new coffee shop\n• Walk by the lake\n• Finish a good book",
    email: "guest@lotion.local",
    when: "October 7, 2026, 4:30 PM",
  },
  {
    id: 3,
    Title: "Project brief",
    Content: "Goal: make planning feel calm and simple.\n\nNext step: turn the rough outline into a small, useful prototype.",
    email: "guest@lotion.local",
    when: "October 6, 2026, 11:15 AM",
  },
  {
    id: 4,
    Title: "Reading list",
    Content: "1. The Design of Everyday Things\n2. Four Thousand Weeks\n3. A short story collection",
    email: "guest@lotion.local",
    when: "October 5, 2026, 8:45 AM",
  },
  {
    id: 5,
    Title: "A tiny daily ritual",
    Content: "Pause. Write down what matters. Do one small thing next.",
    email: "guest@lotion.local",
    when: "October 4, 2026, 7:20 AM",
  },
];

const browserStorage = (): StorageLike | undefined => {
  try {
    if (typeof window === "undefined") return undefined;
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const isGuestNote = (value: Record<string, unknown>): value is Note =>
  typeof value.Content === "string" &&
  typeof value.Title === "string" &&
  typeof value.email === "string" &&
  typeof value.when === "string" &&
  typeof value.id === "number" &&
  Number.isFinite(value.id);

export const guestSeedNotes = (): Note[] => seededNotes.map((note) => ({ ...note }));

/** Seed only when this browser has never started a guest session. */
export const ensureGuestSeeded = (table = guestTable): NotesResult => {
  const existing = table.query(GUEST_EMAIL);
  if (existing.length > 0) return { notes: existing as Note[], count: existing.length };
  const notes = guestSeedNotes();
  notes.forEach((note) => table.putItem(note));
  return { notes, count: notes.length };
};

export const resetGuestDemoData = (table = guestTable): NotesResult => {
  table.reset();
  return ensureGuestSeeded(table);
};

export const createGuestNotesStorage = (
  table = new LocalDynamoTable({
    storageKey: GUEST_STORAGE_KEY,
    storage: browserStorage(),
  }),
): GuestNotesStorage => ({
  read: () => {
    const stored = table.query(GUEST_EMAIL);
    if (!stored.every(isGuestNote)) {
      table.reset();
      return { notes: [], count: 0 };
    }
    const notes = stored as Note[];
    return { notes, count: notes.length };
  },
  write: (result) => {
    const existing = table.query(GUEST_EMAIL);
    result.notes.forEach((note) => table.putItem(note));
    result.notes.length < existing.length &&
      existing
        .filter((item) => !result.notes.some((note) => note.id === item.id))
        .forEach((item) => table.deleteItem(GUEST_EMAIL, Number(item.id)));
  },
  remove: (noteId) => {
    table.deleteItem(GUEST_EMAIL, noteId);
  },
  reset: () => table.reset(),
});

const guestTable = new LocalDynamoTable({
  storageKey: GUEST_STORAGE_KEY,
  storage: browserStorage(),
});

export const guestNotesStorage = createGuestNotesStorage(guestTable);
