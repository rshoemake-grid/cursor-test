/**
 * Storage Adapter Factory
 * Follows Single Responsibility Principle - only handles storage adapter creation
 * Separated from other adapters to improve maintainability and testability
 */ import { isBrowserEnvironment } from '../utils/environment';
/**
 * Storage Adapter Factory
 * Provides factory methods for creating storage adapters
 */ export const StorageAdapterFactory = {
    /**
   * Create storage adapter from Storage object
   * Handles SSR and null/undefined cases
   */ createStorageAdapter (storage) {
        // Use truthy check to handle falsy values (false, 0, '', etc.) as per original behavior
        // This is intentional defensive programming for edge cases
        if (!storage) {
            return null;
        }
        return {
            getItem: (key)=>storage.getItem(key),
            setItem: (key, value)=>storage.setItem(key, value),
            removeItem: (key)=>storage.removeItem(key),
            addEventListener: (type, listener)=>window.addEventListener(type, listener),
            removeEventListener: (type, listener)=>window.removeEventListener(type, listener)
        };
    },
    /**
   * Create default localStorage adapter
   */ createLocalStorageAdapter () {
        if (!isBrowserEnvironment()) {
            return null;
        }
        return this.createStorageAdapter(window.localStorage);
    },
    /**
   * Create default sessionStorage adapter
   */ createSessionStorageAdapter () {
        if (!isBrowserEnvironment()) {
            return null;
        }
        return this.createStorageAdapter(window.sessionStorage);
    }
};
