import { isBrowserEnvironment } from "../utils/environment";
const StorageAdapterFactory = {
  /**
   * Create storage adapter from Storage object
   * Handles SSR and null/undefined cases
   */
  createStorageAdapter(storage) {
    if (!storage) {
      return null;
    }
    return {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
      addEventListener: (type, listener) =>
        window.addEventListener(type, listener),
      removeEventListener: (type, listener) =>
        window.removeEventListener(type, listener),
    };
  },
  /**
   * Create default localStorage adapter
   */
  createLocalStorageAdapter() {
    if (!isBrowserEnvironment()) {
      return null;
    }
    return this.createStorageAdapter(window.localStorage);
  },
  /**
   * Create default sessionStorage adapter
   */
  createSessionStorageAdapter() {
    if (!isBrowserEnvironment()) {
      return null;
    }
    return this.createStorageAdapter(window.sessionStorage);
  },
};
export { StorageAdapterFactory };
