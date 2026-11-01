export {
  createDocumentStore,
  createId,
  createInMemoryDocumentStore,
  createLocalStorageAdapter,
  DocumentStoreError,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from './document-store';

export type {
  Collection,
  CollectionSnapshot,
  DocumentAdapter,
  DocumentStore,
  DocumentStoreErrorCode,
  DocumentStoreOptions,
  DocumentTransaction,
  IdGeneratorSource,
  StorageCollectionKey,
  StorageDocument,
} from './document-store';
