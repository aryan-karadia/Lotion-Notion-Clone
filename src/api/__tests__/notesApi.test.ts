import {
  createGuestNotesApi,
  createNotesApi,
  remoteNotesApi,
  type GuestNotesStorage,
  type Session,
} from "../notesApi";

const note = {
  Content: "Body",
  Title: "Title",
  email: "guest@lotion.local",
  when: "October 8, 2026",
  id: 7,
};

const makeStorage = (initial = [note]): GuestNotesStorage => {
  let result = { notes: [...initial], count: initial.length };
  return {
    read: () => ({ notes: [...result.notes], count: result.count }),
    write: (next) => { result = { notes: [...next.notes], count: next.count }; },
    remove: (id) => {
      result.notes = result.notes.filter((item) => item.id !== id);
      result.count = result.notes.length;
    },
    reset: () => { result = { notes: [], count: 0 }; },
  };
};

const guest: Session = { mode: "guest", email: "guest@lotion.local" };
const google: Session = { mode: "google", email: "person@example.com", token: "token" };

describe("NotesApi guest/remote parity", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("supports guest read, create, update, delete, and persistence through the storage seam", async () => {
    const storage = makeStorage();
    const api = createGuestNotesApi(storage);

    expect(await api.getNotes(guest)).toEqual({ notes: [note], count: 1 });
    const created = { ...note, id: 8, Title: "Created" };
    expect(await api.saveNote(guest, created)).toEqual(created);
    expect((await api.getNotes(guest)).count).toBe(2);
    expect(await api.saveNote(guest, { ...created, Title: "Updated" })).toEqual({
      ...created,
      Title: "Updated",
    });
    expect((await api.getNotes(guest)).notes).toEqual([
      note,
      { ...created, Title: "Updated" },
    ]);
    expect(await api.deleteNote(guest, note.id)).toBe(note.id);
    expect(await api.getNotes(guest)).toEqual({
      notes: [{ ...created, Title: "Updated" }],
      count: 1,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("fails closed for guest sessions without storage and never calls the network", () => {
    expect(() => createNotesApi(guest)).toThrow("Guest notes storage is not configured");
    expect(fetch).not.toHaveBeenCalled();
  });

  test("keeps the remote request contract and normalizes remote IDs", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ notes: [{ ...note, id: "7" }], count: 1 }),
    });

    await expect(remoteNotesApi.getNotes(google)).resolves.toEqual({
      notes: [note],
      count: 1,
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("lambda-url"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          email: google.email,
          "Access-token": google.token,
        }),
      }),
    );
  });
});
