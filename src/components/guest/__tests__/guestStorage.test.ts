import {
  GUEST_STORAGE_KEY,
  createGuestNotesStorage,
  ensureGuestSeeded,
  guestSeedNotes,
} from "../guestStorage";
import { LocalDynamoTable } from "../../../guest/storage/LocalDynamoTable";

const makeStorage = (initial: string | null = null): Storage => {
  let value = initial;
  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn((_key: string, next: string) => { value = next; }),
    removeItem: jest.fn(() => { value = null; }),
  };
};

test("seeds once, persists CRUD, and repairs corrupt or string-ID data", () => {
  const browserStorage = makeStorage();
  const table = new LocalDynamoTable({ storageKey: GUEST_STORAGE_KEY, storage: browserStorage });
  const seeded = ensureGuestSeeded(table);
  expect(seeded.notes).toHaveLength(guestSeedNotes().length);
  expect(browserStorage.setItem).toHaveBeenCalledWith(
    GUEST_STORAGE_KEY,
    expect.stringContaining('"id":1'),
  );

  const storage = createGuestNotesStorage(table);
  const added = {
    ...seeded.notes[0],
    id: 99,
    Title: "Saved",
  };
  storage.write({ notes: [...seeded.notes, added], count: 999 });
  expect(storage.read().count).toBe(seeded.notes.length + 1);
  storage.remove(99);
  expect(storage.read().notes.some(({ id }) => id === 99)).toBe(false);

  browserStorage.getItem = jest.fn(() =>
    JSON.stringify([{ ...seeded.notes[0], id: "42" }]),
  );
  const reloaded = new LocalDynamoTable({ storageKey: GUEST_STORAGE_KEY, storage: browserStorage });
  expect(createGuestNotesStorage(reloaded).read()).toEqual({ notes: [], count: 0 });

  browserStorage.getItem = jest.fn(() => "{corrupt");
  const corrupt = new LocalDynamoTable({ storageKey: GUEST_STORAGE_KEY, storage: browserStorage });
  expect(createGuestNotesStorage(corrupt).read()).toEqual({ notes: [], count: 0 });
});
