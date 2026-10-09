/**
 * A deliberately small, framework-independent DynamoDB-shaped table.
 *
 * The table stores one JSON array under `storageKey`.  The representation is
 * private so callers can use the same operations in a browser and in tests.
 */

export type LocalDynamoItem = Record<string, unknown>;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StorageEvent = {
  type: "put" | "delete" | "reset" | "external";
  partitionKey?: string;
  sortKey?: number;
  item?: LocalDynamoItem;
};

export type LocalDynamoTableOptions = {
  storageKey?: string;
  partitionKey?: string;
  sortKey?: string;
  storage?: StorageLike;
  logger?: Pick<Console, "warn">;
};

export class LocalDynamoQuotaError extends Error {
  readonly code = "quota";

  constructor(message = "Guest storage quota exceeded", cause?: unknown) {
    super(message);
    this.name = "LocalDynamoQuotaError";
    if (cause !== undefined) this.cause = cause;
  }

  readonly cause?: unknown;
}

const isQuotaError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: string; code?: number | string };
  return value.name === "QuotaExceededError" || value.code === 22 || value.code === "QUOTA_EXCEEDED_ERR";
};

const browserStorage = (): StorageLike | undefined => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return undefined;
    // Accessing localStorage can itself throw in privacy mode.
    window.localStorage.getItem("__local_dynamo_probe__");
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const validSortKey = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export class LocalDynamoTable {
  private readonly storageKey: string;
  private readonly partitionKey: string;
  private readonly sortKey: string;
  private readonly logger: Pick<Console, "warn">;
  private storage?: StorageLike;
  private memory: LocalDynamoItem[] = [];
  private readonly reservedIds = new Map<string, Set<number>>();
  private readonly listeners = new Set<(event: StorageEvent) => void>();
  private readonly onWindowStorage?: (event: globalThis.StorageEvent) => void;

  constructor(options: LocalDynamoTableOptions | string = {}, storage?: StorageLike) {
    const config = typeof options === "string" ? { storageKey: options, storage } : options;
    this.storageKey = config.storageKey ?? "lotion.guest.notes";
    this.partitionKey = config.partitionKey ?? "email";
    this.sortKey = config.sortKey ?? "id";
    this.logger = config.logger ?? console;
    this.storage = config.storage ?? browserStorage();
    this.memory = this.load();

    if (typeof window !== "undefined") {
      this.onWindowStorage = (event) => {
        if (event.key !== this.storageKey || (event.storageArea && event.storageArea !== this.storage)) return;
        this.memory = this.parse(event.newValue);
        this.emit({ type: "external" });
      };
      window.addEventListener("storage", this.onWindowStorage);
    }
  }

  putItem(item: LocalDynamoItem): LocalDynamoItem {
    const key = this.keys(item);
    this.reservedIds.get(key.partitionKey)?.delete(key.sortKey);
    const next = this.memory.filter((value) => !this.sameKeys(value, key));
    const stored = { ...item };
    next.push(stored);
    this.persist(next);
    this.emit({ type: "put", ...key, item: { ...stored } });
    return { ...stored };
  }

  getItem(partitionValue: string, sortValue: number): LocalDynamoItem | undefined {
    const item = this.memory.find((value) =>
      this.sameKeys(value, { partitionKey: String(partitionValue), sortKey: sortValue }),
    );
    return item ? { ...item } : undefined;
  }

  deleteItem(partitionValue: string, sortValue: number): boolean {
    const key = { partitionKey: String(partitionValue), sortKey: sortValue };
    const next = this.memory.filter((value) => !this.sameKeys(value, key));
    const deleted = next.length !== this.memory.length;
    if (deleted) this.persist(next);
    // Deletes are idempotent, but still notify subscribers of the operation.
    this.emit({ type: "delete", ...key });
    return deleted;
  }

  query(partitionValue: string): LocalDynamoItem[] {
    return this.memory
      .filter((item) => String(item[this.partitionKey]) === String(partitionValue))
      .sort((a, b) => Number(a[this.sortKey]) - Number(b[this.sortKey]))
      .map((item) => ({ ...item }));
  }

  /** Returns the first unused positive numeric sort key for a partition. */
  generateId(partitionValue: string): number {
    const partition = String(partitionValue);
    const used = new Set(this.query(partition).map((item) => Number(item[this.sortKey])));
    const reserved = this.reservedIds.get(partition) ?? new Set<number>();
    this.reservedIds.set(partition, reserved);
    let candidate = 1;
    while (used.has(candidate) || reserved.has(candidate)) candidate += 1;
    reserved.add(candidate);
    return candidate;
  }

  // Alias useful to callers migrating from the old nextId terminology.
  nextId(partitionValue: string): number {
    return this.generateId(partitionValue);
  }

  subscribe(listener: (event: StorageEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.memory = [];
    if (this.storage) {
      try {
        this.storage.removeItem(this.storageKey);
      } catch {
        this.storage = undefined;
      }
    }
    this.emit({ type: "reset" });
  }

  dispose(): void {
    if (this.onWindowStorage && typeof window !== "undefined") {
      window.removeEventListener("storage", this.onWindowStorage);
    }
    this.listeners.clear();
  }

  private keys(item: LocalDynamoItem): { partitionKey: string; sortKey: number } {
    const partition = item[this.partitionKey];
    const sort = item[this.sortKey];
    if (typeof partition !== "string" || !partition) {
      throw new TypeError(`Missing string partition key "${this.partitionKey}"`);
    }
    if (!validSortKey(sort)) {
      throw new TypeError(`Missing numeric sort key "${this.sortKey}"`);
    }
    return { partitionKey: partition, sortKey: sort };
  }

  private sameKeys(item: LocalDynamoItem, key: { partitionKey: string; sortKey: number }): boolean {
    return String(item[this.partitionKey]) === key.partitionKey && Number(item[this.sortKey]) === key.sortKey;
  }

  private load(): LocalDynamoItem[] {
    if (!this.storage) return [];
    try {
      return this.parse(this.storage.getItem(this.storageKey));
    } catch {
      this.storage = undefined;
      return [];
    }
  }

  private parse(serialized: string | null): LocalDynamoItem[] {
    if (serialized === null) return [];
    try {
      const value: unknown = JSON.parse(serialized);
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Expected a partition-key object");
      }
      const items: LocalDynamoItem[] = [];
      Object.entries(value).forEach(([partitionKey, partition]) => {
        if (!partition || typeof partition !== "object" || Array.isArray(partition)) {
          throw new Error("Expected a sort-key object");
        }
        Object.entries(partition).forEach(([sortKey, item]) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            throw new Error("Expected an item object");
          }
          const normalized = { ...(item as LocalDynamoItem), [this.partitionKey]: partitionKey };
          const numericSortKey = Number(normalized[this.sortKey] ?? sortKey);
          if (!validSortKey(numericSortKey)) throw new Error("Expected a numeric sort key");
          normalized[this.sortKey] = numericSortKey;
          items.push(normalized);
        });
      });
      return items;
    } catch (error) {
      this.logger.warn("Corrupt guest storage was reset", error);
      this.memory = [];
      try {
        this.storage?.removeItem(this.storageKey);
      } catch {
        this.storage = undefined;
      }
      return [];
    }
  }

  private persist(items: LocalDynamoItem[]): void {
    const table: Record<string, Record<string, LocalDynamoItem>> = {};
    items.forEach((item) => {
      const partitionKey = String(item[this.partitionKey]);
      const sortKey = String(item[this.sortKey]);
      table[partitionKey] ??= {};
      table[partitionKey][sortKey] = { ...item, [this.partitionKey]: partitionKey, [this.sortKey]: Number(sortKey) };
    });
    const serialized = JSON.stringify(table);
    if (this.storage) {
      try {
        this.storage.setItem(this.storageKey, serialized);
      } catch (error) {
        if (isQuotaError(error)) throw new LocalDynamoQuotaError(undefined, error);
        // A storage backend can become unavailable after construction.
        this.storage = undefined;
      }
    }
    this.memory = items;
  }

  private emit(event: StorageEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

export default LocalDynamoTable;
