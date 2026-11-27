import type { ProjectMeta, StoredProject } from '../types/project';

const DATABASE_NAME = 'drawsidecar-projects';
const DATABASE_VERSION = 1;
const STORE_NAME = 'projects';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? request.transaction?.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: 'meta.id' });
      store?.createIndex('updatedAt', 'meta.updatedAt', { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('无法打开本地项目数据库。'));
  });
}

function transactionError(transaction: IDBTransaction): Promise<never> {
  return new Promise((_, reject) => {
    transaction.onerror = () => reject(new Error('本地项目保存失败。'));
    transaction.onabort = () => reject(new Error('本地项目保存已取消。'));
  });
}

export async function saveProject(project: StoredProject): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(project);
    await Promise.race([
      new Promise<void>((resolve) => { transaction.oncomplete = () => resolve(); }),
      transactionError(transaction)
    ]);
  } finally {
    database.close();
  }
}

export async function loadProject(id: string): Promise<StoredProject | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(id);
    return await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as StoredProject | undefined) ?? null);
      request.onerror = () => reject(new Error('无法读取本地项目。'));
    });
  } finally {
    database.close();
  }
}

export async function loadLatestProject(): Promise<StoredProject | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const index = transaction.objectStore(STORE_NAME).index('updatedAt');
    const request = index.openCursor(null, 'prev');
    return await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve((request.result?.value as StoredProject | undefined) ?? null);
      request.onerror = () => reject(new Error('无法读取最近的本地项目。'));
    });
  } finally {
    database.close();
  }
}

export async function deleteProject(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    await Promise.race([
      new Promise<void>((resolve) => { transaction.oncomplete = () => resolve(); }),
      transactionError(transaction)
    ]);
  } finally {
    database.close();
  }
}

export function createProjectMeta(sourceHash: string, fileName: string, width: number, height: number, now = Date.now()): ProjectMeta {
  return { id: crypto.randomUUID(), name: fileName, width, height, imageHash: sourceHash, revision: 0, createdAt: now, updatedAt: now };
}
