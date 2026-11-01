export const STORAGE_KEY = 'purchase-tracker:data';

export const SCHEMA_VERSION = 1;

export interface IdGeneratorSource {
  randomUUID?: () => string;
  getRandomValues?: (values: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;
}

export const createId = (source: IdGeneratorSource | undefined = globalThis.crypto): string => {
  if (source?.randomUUID) {
    return source.randomUUID();
  }

  const bytes = new Uint8Array(new ArrayBuffer(16));

  if (source?.getRandomValues) {
    source.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

export interface StorageDocument<
  Purchase extends { id: string } = { id: string },
  Receipt extends { id: string } = { id: string },
  Operation extends { id: string } = { id: string },
  Category extends { id: string } = { id: string },
> {
  schemaVersion: 1;
  purchases: Purchase[];
  receipts: Receipt[];
  operations: Operation[];
  categories: Category[];
}

export type StorageCollectionKey = 'purchases' | 'receipts' | 'operations' | 'categories';

export interface CollectionSnapshot<T> {
  status: 'loading' | 'ready' | 'error';
  items: readonly T[];
  error: DocumentStoreError | null;
}

export interface Collection<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  add(item: T): Promise<void>;
  update(item: T): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(listener: (snapshot: CollectionSnapshot<T>) => void): () => void;
}

export interface DocumentTransaction<T extends StorageDocument> {
  document: T;
}

export interface DocumentStore<T extends StorageDocument> {
  collection<Item extends { id: string }, K extends StorageCollectionKey = StorageCollectionKey>(
    key: K
  ): Collection<Item>;
  getDocument(): Promise<T>;
  transaction(mutator: (transaction: DocumentTransaction<T>) => void): Promise<void>;
  getRawValue(): string | null;
  destroy(): void;
}

export interface DocumentStoreOptions<T extends StorageDocument> {
  createEmptyDocument: () => T;
  validateDocument?: (value: unknown) => value is T;
}

export interface DocumentAdapter {
  read(): string | null;
  write(value: string): void;
  subscribe?(listener: () => void): () => void;
}

export type DocumentStoreErrorCode =
  'load-failed' | 'invalid-json' | 'invalid-document' | 'unknown-schema-version' | 'write-failed';

export class DocumentStoreError extends Error {
  constructor(
    public readonly code: DocumentStoreErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'DocumentStoreError';
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasDocumentCollections = (value: unknown): value is StorageDocument => {
  if (!isObject(value)) {
    return false;
  }

  const collections = [value.purchases, value.receipts, value.operations, value.categories];

  return (
    value.schemaVersion === SCHEMA_VERSION &&
    collections.every(
      (collection) =>
        Array.isArray(collection) &&
        collection.every(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            !Array.isArray(item) &&
            typeof (item as { id?: unknown }).id === 'string'
        )
    )
  );
};

const clone = <T>(value: T): T => structuredClone(value);

class SharedDocumentStore<T extends StorageDocument> implements DocumentStore<T> {
  private document: T | undefined;
  private loadPromise: Promise<T> | undefined;
  private loadError: DocumentStoreError | null = null;
  private mutationQueue: Promise<void> = Promise.resolve();
  private readonly subscribers = new Map<
    string,
    Set<(snapshot: CollectionSnapshot<unknown>) => void>
  >();
  private readonly unsubscribeAdapter: (() => void) | undefined;
  private destroyed = false;

  constructor(
    private readonly adapter: DocumentAdapter,
    private readonly options: DocumentStoreOptions<T>
  ) {
    this.unsubscribeAdapter = adapter.subscribe?.(() => {
      void this.reloadFromAdapter();
    });
  }

  collection<Item extends { id: string }, K extends StorageCollectionKey = StorageCollectionKey>(
    key: K
  ): Collection<Item> {
    const collectionKey = String(key);
    const listeners = this.getSubscribers(collectionKey);

    return {
      getAll: async () => clone((await this.getDocument())[key] as unknown as Item[]),
      getById: async (id) => {
        const items = (await this.getDocument())[key] as unknown as Item[];
        const item = items.find((entry) => entry.id === id);

        return item ? clone(item) : undefined;
      },
      add: async (item) => {
        await this.transaction(({ document }) => {
          const items = document[key] as unknown as Item[];

          if (items.some((entry) => entry.id === item.id)) {
            throw new DocumentStoreError('invalid-document', `Duplicate id "${item.id}"`);
          }

          items.push(clone(item));
        });
      },
      update: async (item) => {
        await this.transaction(({ document }) => {
          const items = document[key] as unknown as Item[];
          const index = items.findIndex((entry) => entry.id === item.id);

          if (index < 0) {
            throw new DocumentStoreError('invalid-document', `Record "${item.id}" was not found`);
          }

          items[index] = clone(item);
        });
      },
      remove: async (id) => {
        await this.transaction(({ document }) => {
          const items = document[key] as unknown as Item[];
          const remaining = items.filter((entry) => entry.id !== id);
          items.splice(0, items.length, ...remaining);
        });
      },
      subscribe: (listener) => {
        const notify = listener as unknown as (snapshot: CollectionSnapshot<unknown>) => void;
        listeners.add(notify);

        void this.getDocument().then(
          () => this.notifyCollection(collectionKey),
          () => undefined
        );

        return () => {
          listeners.delete(notify);
        };
      },
    };
  }

  async getDocument(): Promise<T> {
    this.assertNotDestroyed();

    if (this.loadError) {
      throw this.loadError;
    }

    if (this.document) {
      return clone(this.document);
    }

    if (!this.loadPromise) {
      this.loadPromise = this.load();
    }

    return clone(await this.loadPromise);
  }

  transaction(mutator: (transaction: DocumentTransaction<T>) => void): Promise<void> {
    this.assertNotDestroyed();

    const task = this.mutationQueue.then(async () => {
      const current = await this.getDocument();
      const draft = clone(current);

      mutator({ document: draft });
      this.assertValidDocument(draft);

      try {
        this.adapter.write(JSON.stringify(draft));
      } catch (error) {
        throw new DocumentStoreError('write-failed', 'Could not save the storage document', {
          cause: error,
        });
      }

      this.document = draft;
      this.loadPromise = Promise.resolve(draft);
      this.loadError = null;
      this.notifyAll();
    });

    this.mutationQueue = task.catch(() => undefined);

    return task;
  }

  getRawValue(): string | null {
    try {
      return this.adapter.read();
    } catch (error) {
      throw new DocumentStoreError('load-failed', 'Could not read the raw storage value', {
        cause: error,
      });
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubscribeAdapter?.();
    this.subscribers.clear();
  }

  private async load(): Promise<T> {
    let raw: string | null;

    try {
      raw = this.adapter.read();
    } catch (error) {
      const storeError = new DocumentStoreError(
        'load-failed',
        'Could not load the storage document',
        {
          cause: error,
        }
      );
      this.setLoadError(storeError);
      throw storeError;
    }

    if (raw === null) {
      const emptyDocument = this.options.createEmptyDocument();
      this.assertValidDocument(emptyDocument);
      this.document = clone(emptyDocument);

      return this.document;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      const storeError = new DocumentStoreError(
        'invalid-json',
        'The storage document contains invalid JSON',
        { cause: error }
      );
      this.setLoadError(storeError);
      throw storeError;
    }

    if (!isObject(parsed)) {
      const storeError = new DocumentStoreError(
        'invalid-document',
        'The storage document must be an object'
      );
      this.setLoadError(storeError);
      throw storeError;
    }

    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const storeError = new DocumentStoreError(
        'unknown-schema-version',
        `Unsupported storage schema version: ${String(parsed.schemaVersion)}`
      );
      this.setLoadError(storeError);
      throw storeError;
    }

    if (!hasDocumentCollections(parsed) || !this.isDocumentValid(parsed)) {
      const storeError = new DocumentStoreError(
        'invalid-document',
        'The storage document has an invalid structure'
      );
      this.setLoadError(storeError);
      throw storeError;
    }

    this.document = clone(parsed as T);
    this.loadError = null;

    return this.document;
  }

  private async reloadFromAdapter(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    const task = this.mutationQueue.then(async () => {
      this.document = undefined;
      this.loadPromise = undefined;
      this.loadError = null;

      try {
        await this.getDocument();
      } catch {
        // The failure is exposed in collection snapshots and by subsequent reads.
      }

      this.notifyAll();
    });

    this.mutationQueue = task.catch(() => undefined);
    await task;
  }

  private assertValidDocument(value: unknown): asserts value is T {
    if (!hasDocumentCollections(value) || !this.isDocumentValid(value)) {
      throw new DocumentStoreError(
        'invalid-document',
        'The storage document has an invalid structure'
      );
    }
  }

  private isDocumentValid(value: unknown): value is T {
    return this.options.validateDocument ? this.options.validateDocument(value) : true;
  }

  private setLoadError(error: DocumentStoreError): void {
    this.loadError = error;
    this.notifyAll();
  }

  private getSnapshot(key: string): CollectionSnapshot<unknown> {
    const collection = this.document?.[key as keyof T];
    const items = Array.isArray(collection) ? collection : [];
    let status: CollectionSnapshot<unknown>['status'] = 'loading';

    if (this.document) {
      status = 'ready';
    }

    if (this.loadError) {
      status = 'error';
    }

    return {
      status,
      items: clone(items),
      error: this.loadError,
    };
  }

  private getSubscribers(key: string): Set<(snapshot: CollectionSnapshot<unknown>) => void> {
    const existing = this.subscribers.get(key);

    if (existing) {
      return existing;
    }

    const listeners = new Set<(snapshot: CollectionSnapshot<unknown>) => void>();
    this.subscribers.set(key, listeners);

    return listeners;
  }

  private notifyAll(): void {
    for (const [key, listeners] of this.subscribers) {
      const snapshot = this.getSnapshot(key);

      for (const listener of listeners) {
        try {
          listener(snapshot);
        } catch (error) {
          console.error('Document store subscriber failed', error);
        }
      }
    }
  }

  private notifyCollection(key: string): void {
    const snapshot = this.getSnapshot(key);
    const listeners = this.subscribers.get(key);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('Document store subscriber failed', error);
      }
    }
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('The document store has been destroyed');
    }
  }
}

export const createDocumentStore = <T extends StorageDocument>(
  adapter: DocumentAdapter,
  options: DocumentStoreOptions<T>
): DocumentStore<T> => new SharedDocumentStore(adapter, options);

export const createInMemoryDocumentStore = <T extends StorageDocument>(
  options: DocumentStoreOptions<T>,
  initialDocument: T = options.createEmptyDocument()
): DocumentStore<T> => {
  let raw = JSON.stringify(initialDocument);
  const adapter: DocumentAdapter = {
    read: () => raw,
    write: (value) => {
      raw = value;
    },
  };

  return createDocumentStore(adapter, options);
};

export const createLocalStorageAdapter = (
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  eventTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>
): DocumentAdapter => ({
  read: () => storage.getItem(STORAGE_KEY),
  write: (value) => storage.setItem(STORAGE_KEY, value),
  subscribe: eventTarget
    ? (listener) => {
        const handleStorage = (event: Event) => {
          const storageEvent = event as StorageEvent;

          if (storageEvent.key === STORAGE_KEY || storageEvent.key === null) {
            listener();
          }
        };

        eventTarget.addEventListener('storage', handleStorage);

        return () => eventTarget.removeEventListener('storage', handleStorage);
      }
    : undefined,
});
