import LocalDynamoTable, { LocalDynamoQuotaError } from "./LocalDynamoTable";

const fakeStorage = (initial = null) => {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
  };
};

test("puts, overwrites, and queries items in numeric sort order", () => {
  const table = new LocalDynamoTable({ storage: fakeStorage() });
  table.putItem({ email: "guest", id: 10, Title: "ten" });
  table.putItem({ email: "guest", id: 2, Title: "two" });
  table.putItem({ email: "guest", id: 2, Title: "updated" });

  expect(table.query("guest").map((item) => item.id)).toEqual([2, 10]);
  expect(table.getItem("guest", 2).Title).toBe("updated");
  expect(table.deleteItem("guest", 99)).toBe(false);
});

test("resets corrupt data and logs it", () => {
  const logger = { warn: jest.fn() };
  const storage = fakeStorage("{not-json");
  const table = new LocalDynamoTable({ storage, logger });

  expect(table.query("guest")).toEqual([]);
  expect(logger.warn).toHaveBeenCalled();
});

test("generates distinct collision-free IDs", () => {
  const table = new LocalDynamoTable({ storage: fakeStorage() });
  table.putItem({ email: "guest", id: 2 });

  expect(table.generateId("guest")).toBe(1);
  expect(table.generateId("guest")).toBe(3);
});

test("surfaces quota failures instead of silently losing a write", () => {
  const storage = fakeStorage();
  storage.setItem = () => { throw { name: "QuotaExceededError" }; };
  const table = new LocalDynamoTable({ storage });

  expect(() => table.putItem({ email: "guest", id: 1 })).toThrow(LocalDynamoQuotaError);
});
