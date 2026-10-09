import {
  GUEST_SESSION_KEY,
  endGuestSession,
  getGuestSession,
  startGuestSession,
} from "../index";
import type { GuestNotesStorage } from "../../../api/notesApi";

const storage = (): GuestNotesStorage => ({
  read: () => ({ notes: [], count: 0 }),
  write: jest.fn(),
  remove: jest.fn(),
  reset: jest.fn(),
});

beforeEach(() => sessionStorage.clear());

test("starts, restores, and ends a guest session without a token", () => {
  const guestStorage = storage();
  expect(startGuestSession({ storage: guestStorage })).toEqual({
    mode: "guest",
    email: "guest@lotion.local",
  });
  expect(guestStorage.reset).toHaveBeenCalled();
  expect(getGuestSession()).toEqual({
    mode: "guest",
    email: "guest@lotion.local",
  });
  expect(JSON.parse(sessionStorage.getItem(GUEST_SESSION_KEY)!)).not.toHaveProperty("token");

  endGuestSession(guestStorage, { wipe: true });
  expect(getGuestSession()).toBeNull();
  expect(guestStorage.reset).toHaveBeenCalledTimes(2);
});
