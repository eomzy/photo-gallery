const DB_NAME = 'photo-gallery';
const DB_VERSION = 1;

let dbPromise = null;

function openDatabase() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('tags')) {
          const tags = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
          tags.createIndex('nameLower', 'nameLower', { unique: true });
        }
        if (!db.objectStoreNames.contains('photoTags')) {
          const photoTags = db.createObjectStore('photoTags', { keyPath: 'id', autoIncrement: true });
          photoTags.createIndex('photoId', 'photoId');
          photoTags.createIndex('tagId', 'tagId');
          photoTags.createIndex('photoId_tagId', ['photoId', 'tagId'], { unique: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export function getDb() {
  return openDatabase();
}

export function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function txDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'));
  });
}

// Test-only: closes the open connection (if any) so a subsequent
// indexedDB.deleteDatabase() call doesn't block waiting for it, then
// drops the cached promise so the next getDb() reopens fresh.
export async function resetConnectionForTests() {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}
