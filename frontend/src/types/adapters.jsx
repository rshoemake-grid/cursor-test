import { StorageAdapterFactory } from "../adapters/storage";
import { HttpClientFactory } from "../adapters/http";
import { DocumentAdapterFactory } from "../adapters/document";
import { TimerAdapterFactory } from "../adapters/timer";
import { WebSocketFactoryFactory } from "../adapters/websocket";
import { LocationAdapterFactory } from "../adapters/location";
import { ConsoleAdapterFactory } from "../adapters/console";
import { EnvironmentAdapterFactory } from "../adapters/environment";
const defaultAdapters = {
  /**
   * Create default storage adapter (handles SSR)
   * Delegates to StorageAdapterFactory for SRP compliance
   */
  createStorageAdapter(storage) {
    return StorageAdapterFactory.createStorageAdapter(storage);
  },
  /**
   * Create default localStorage adapter
   * Delegates to StorageAdapterFactory for SRP compliance
   */
  createLocalStorageAdapter() {
    return StorageAdapterFactory.createLocalStorageAdapter();
  },
  /**
   * Create default sessionStorage adapter
   * Delegates to StorageAdapterFactory for SRP compliance
   */
  createSessionStorageAdapter() {
    return StorageAdapterFactory.createSessionStorageAdapter();
  },
  /**
   * Create default HTTP client using fetch
   * Delegates to HttpClientFactory for SRP compliance
   */
  createHttpClient() {
    return HttpClientFactory.createHttpClient();
  },
  /**
   * Create default document adapter
   * Delegates to DocumentAdapterFactory for SRP compliance
   */
  createDocumentAdapter() {
    return DocumentAdapterFactory.createDocumentAdapter();
  },
  /**
   * Create default timer adapter
   * Delegates to TimerAdapterFactory for SRP compliance
   */
  createTimerAdapter() {
    return TimerAdapterFactory.createTimerAdapter();
  },
  /**
   * Create default WebSocket factory
   * Delegates to WebSocketFactoryFactory for SRP compliance
   */
  createWebSocketFactory() {
    return WebSocketFactoryFactory.createWebSocketFactory();
  },
  /**
   * Create default window location adapter
   * Delegates to LocationAdapterFactory for SRP compliance
   */
  createWindowLocation() {
    return LocationAdapterFactory.createWindowLocation();
  },
  /**
   * Create default console adapter
   * Delegates to ConsoleAdapterFactory for SRP compliance
   */
  createConsoleAdapter() {
    return ConsoleAdapterFactory.createConsoleAdapter();
  },
  /**
   * Create default environment adapter
   * Delegates to EnvironmentAdapterFactory for SRP compliance
   */
  createEnvironmentAdapter() {
    return EnvironmentAdapterFactory.createEnvironmentAdapter();
  }
};
export {
  defaultAdapters
};
