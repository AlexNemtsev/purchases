import { describe, expect, it, vi } from 'vitest';

import {
  createDocumentStore,
  createId,
  createInMemoryDocumentStore,
  createLocalStorageAdapter,
  DocumentStoreError,
  STORAGE_KEY,
  type DocumentAdapter,
  type DocumentStore,
  type StorageDocument,
} from './index';

interface Item {
  id: string;
  value: string;
}

type TestDocument = StorageDocument<Item, Item, Item, Item>;

const createEmptyDocument = (): TestDocument => ({
  schemaVersion: 1,
  purchases: [],
  receipts: [],
  operations: [],
  categories: [],
});

const storeOptions = {
  createEmptyDocument,
  validateDocument: (value: unknown): value is TestDocument => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const document = value as Partial<TestDocument>;

    return (
      document.purchases?.every((item) => typeof item.id === 'string') === true &&
      document.receipts?.every((item) => typeof item.id === 'string') === true &&
      document.operations?.every((item) => typeof item.id === 'string') === true &&
      document.categories?.every((item) => typeof item.id === 'string') === true
    );
  },
};

class TestStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();
  failWrites: unknown = null;
  onExternalWrite: (() => void) | undefined;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) {
      throw this.failWrites;
    }

    this.values.set(key, value);
  }

  externalWrite(key: string, value: string | null): void {
    if (value === null) {
      this.values.delete(key);
    } else {
      this.values.set(key, value);
    }

    this.onExternalWrite?.();
  }
}

class TestEventTarget implements Pick<Window, 'addEventListener' | 'removeEventListener'> {
  private listeners = new Set<(event: Event) => void>();

  addEventListener(_type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.add(listener as (event: Event) => void);
  }

  removeEventListener(_type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.delete(listener as (event: Event) => void);
  }

  dispatchStorage(key: string | null): void {
    const event = { key } as StorageEvent;

    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

const createTestLocalStore = (storage: TestStorage, events?: TestEventTarget) =>
  createDocumentStore(createLocalStorageAdapter(storage, events), storeOptions);

const exerciseCollectionContract = async (store: DocumentStore<TestDocument>) => {
  const purchases = store.collection<Item>('purchases');

  expect(await purchases.getAll()).toEqual([]);
  await purchases.add({ id: 'p1', value: 'first' });
  expect(await purchases.getById('p1')).toEqual({ id: 'p1', value: 'first' });

  await purchases.update({ id: 'p1', value: 'updated' });
  expect(await purchases.getAll()).toEqual([{ id: 'p1', value: 'updated' }]);

  await purchases.remove('p1');
  expect(await purchases.getAll()).toEqual([]);
};

describe('document-store collection contract', () => {
  it('uses randomUUID when available and has an RFC 4122 UUID fallback', () => {
    expect(createId({ randomUUID: () => 'from-random-uuid' })).toBe('from-random-uuid');

    const uuid = createId({
      getRandomValues: (values) => values.fill(0),
    });

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);

    expect(createId(undefined)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
    );
  });

  it('supports asynchronous CRUD in memory', async () => {
    await exerciseCollectionContract(createInMemoryDocumentStore(storeOptions));
  });

  it('supports asynchronous CRUD in localStorage', async () => {
    const storage = new TestStorage();

    await exerciseCollectionContract(createTestLocalStore(storage));

    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null')).toMatchObject({
      schemaVersion: 1,
      purchases: [],
    });
  });

  it('does not persist the empty document before the first mutation', async () => {
    const storage = new TestStorage();
    const store = createTestLocalStore(storage);

    expect(await store.getDocument()).toEqual(createEmptyDocument());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('notifies subscribers after loading and each committed mutation', async () => {
    const store = createInMemoryDocumentStore(storeOptions);
    const snapshots: string[] = [];
    const unsubscribe = store.collection<Item>('purchases').subscribe(({ status, items }) => {
      snapshots.push(`${status}:${items.map((item) => item.id).join(',')}`);
    });

    await store.collection<Item>('purchases').add({ id: 'p1', value: 'first' });

    expect(snapshots).toContain('ready:');
    expect(snapshots.at(-1)).toBe('ready:p1');

    unsubscribe();
  });
});

describe('document-store transactions', () => {
  it('commits updates to multiple collections in one document write', async () => {
    let writes = 0;
    const initialDocument = createEmptyDocument();
    const adapter: DocumentAdapter = {
      read: () => JSON.stringify(initialDocument),
      write: () => {
        writes += 1;
      },
    };
    const store = createDocumentStore(adapter, storeOptions);

    await store.transaction(({ document }) => {
      document.purchases.push({ id: 'p1', value: 'purchase' });
      document.receipts.push({ id: 'r1', value: 'receipt' });
    });

    expect(writes).toBe(1);

    expect(await store.getDocument()).toMatchObject({
      purchases: [{ id: 'p1', value: 'purchase' }],
      receipts: [{ id: 'r1', value: 'receipt' }],
    });
  });

  it('rolls back in-memory state when the mutator throws', async () => {
    const store = createInMemoryDocumentStore(storeOptions);

    await expect(
      store.transaction(({ document }) => {
        document.purchases.push({ id: 'p1', value: 'temporary' });
        throw new Error('transaction aborted');
      })
    ).rejects.toThrow('transaction aborted');

    expect((await store.getDocument()).purchases).toEqual([]);
  });

  it('surfaces write failures and preserves the previous document', async () => {
    const storage = new TestStorage();
    const store = createTestLocalStore(storage);

    await store.collection<Item>('purchases').add({ id: 'p1', value: 'saved' });
    const previousValue = storage.getItem(STORAGE_KEY);
    storage.failWrites = new Error('quota exceeded');

    await expect(
      store.collection<Item>('purchases').add({ id: 'p2', value: 'not saved' })
    ).rejects.toMatchObject({
      code: 'write-failed',
    });

    expect(storage.getItem(STORAGE_KEY)).toBe(previousValue);

    expect(await store.collection<Item>('purchases').getAll()).toEqual([
      { id: 'p1', value: 'saved' },
    ]);
  });

  it('rejects duplicate IDs and updates to missing records', async () => {
    const purchases = createInMemoryDocumentStore(storeOptions).collection<Item>('purchases');

    await purchases.add({ id: 'p1', value: 'first' });

    await expect(purchases.add({ id: 'p1', value: 'duplicate' })).rejects.toBeInstanceOf(
      DocumentStoreError
    );

    await expect(purchases.update({ id: 'missing', value: 'missing' })).rejects.toBeInstanceOf(
      DocumentStoreError
    );
  });
});

describe('document-store validation and external changes', () => {
  it('rejects corrupt JSON and blocks writes without changing the raw value', async () => {
    const storage = new TestStorage();
    storage.externalWrite(STORAGE_KEY, '{broken');
    const store = createTestLocalStore(storage);

    await expect(store.getDocument()).rejects.toMatchObject({ code: 'invalid-json' });

    await expect(
      store.collection<Item>('purchases').add({ id: 'p1', value: 'x' })
    ).rejects.toMatchObject({ code: 'invalid-json' });

    expect(store.getRawValue()).toBe('{broken');
  });

  it('rejects unknown schema versions and invalid document shapes', async () => {
    const storage = new TestStorage();

    storage.externalWrite(
      STORAGE_KEY,
      JSON.stringify({ ...createEmptyDocument(), schemaVersion: 2 })
    );

    await expect(createTestLocalStore(storage).getDocument()).rejects.toMatchObject({
      code: 'unknown-schema-version',
    });

    storage.externalWrite(STORAGE_KEY, JSON.stringify({ ...createEmptyDocument(), receipts: {} }));

    await expect(createTestLocalStore(storage).getDocument()).rejects.toMatchObject({
      code: 'invalid-document',
    });

    storage.externalWrite(
      STORAGE_KEY,
      JSON.stringify({ ...createEmptyDocument(), purchases: [{ id: 1 }] })
    );

    await expect(createTestLocalStore(storage).getDocument()).rejects.toMatchObject({
      code: 'invalid-document',
    });
  });

  it('reloads and notifies subscribers on matching storage events', async () => {
    const storage = new TestStorage();
    const events = new TestEventTarget();
    storage.onExternalWrite = () => events.dispatchStorage(STORAGE_KEY);
    const store = createTestLocalStore(storage, events);
    const purchases = store.collection<Item>('purchases');
    const snapshots: string[] = [];

    await purchases.getAll();
    purchases.subscribe(({ items }) => snapshots.push(items.map((item) => item.id).join(',')));

    storage.externalWrite(
      STORAGE_KEY,
      JSON.stringify({
        ...createEmptyDocument(),
        purchases: [{ id: 'external', value: 'from another tab' }],
      })
    );

    await vi.waitFor(() => expect(snapshots.at(-1)).toBe('external'));
  });

  it('ignores storage events for unrelated keys and unsubscribes on destroy', async () => {
    const storage = new TestStorage();
    const events = new TestEventTarget();
    const store = createTestLocalStore(storage, events);
    const snapshots: string[] = [];

    await store.collection<Item>('purchases').getAll();

    store
      .collection<Item>('purchases')
      .subscribe(({ items }) => snapshots.push(items.map(({ id }) => id).join()));

    events.dispatchStorage('unrelated');
    await Promise.resolve();
    expect(snapshots.at(-1)).toBe('');

    store.destroy();
    storage.externalWrite(STORAGE_KEY, JSON.stringify(createEmptyDocument()));
    events.dispatchStorage(STORAGE_KEY);
    await expect(store.getDocument()).rejects.toThrow('destroyed');
  });
});
