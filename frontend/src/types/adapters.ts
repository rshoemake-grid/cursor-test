/**
 * Adapter interfaces for dependency injection
 * These interfaces abstract browser APIs and external dependencies to improve testability
 */

import { isBrowserEnvironment } from '../utils/environment'
import { isNullOrUndefined } from '../utils/typeGuards'
import { StorageAdapterFactory } from '../adapters/storage'
import { HttpClientFactory } from '../adapters/http'
import { DocumentAdapterFactory } from '../adapters/document'
import { TimerAdapterFactory } from '../adapters/timer'
import { WebSocketFactoryFactory } from '../adapters/websocket'
import { LocationAdapterFactory } from '../adapters/location'
import { ConsoleAdapterFactory } from '../adapters/console'
import { EnvironmentAdapterFactory } from '../adapters/environment'

/**
 * Storage adapter for localStorage/sessionStorage abstraction
 */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

/**
 * HTTP client adapter for fetch/axios abstraction
 */
export interface HttpClient {
  get(url: string, headers?: HeadersInit): Promise<Response>
  post(url: string, body: any, headers?: HeadersInit): Promise<Response>
  put(url: string, body: any, headers?: HeadersInit): Promise<Response>
  delete(url: string, headers?: HeadersInit): Promise<Response>
}

/**
 * Document adapter for DOM manipulation abstraction
 */
export interface DocumentAdapter {
  createElement(tag: string): HTMLElement
  getElementById(id: string): HTMLElement | null
  getActiveElement(): Element | null
  head: HTMLElement
  body: HTMLElement
}

/**
 * Timer adapter for setTimeout/setInterval abstraction
 */
export interface TimerAdapter {
  setTimeout(callback: () => void, delay: number): number
  clearTimeout(id: number): void
  setInterval(callback: () => void, delay: number): number
  clearInterval(id: number): void
}

/**
 * WebSocket factory for WebSocket creation abstraction
 */
export interface WebSocketFactory {
  create(url: string): WebSocket
}

/**
 * Window location adapter
 */
export interface WindowLocation {
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
}

/**
 * Console adapter for logging abstraction
 */
export interface ConsoleAdapter {
  log(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  debug?(...args: any[]): void
}

/**
 * Environment adapter for environment variable abstraction
 */
export interface EnvironmentAdapter {
  isDevelopment(): boolean
  isProduction(): boolean
  get(key: string): string | undefined
}

/**
 * Default implementations that use browser APIs
 */
export const defaultAdapters = {
  /**
   * Create default storage adapter (handles SSR)
   * Delegates to StorageAdapterFactory for SRP compliance
   */
  createStorageAdapter(storage: Storage | null): StorageAdapter | null {
    return StorageAdapterFactory.createStorageAdapter(storage)
  },

  /**
   * Create default localStorage adapter
   * Delegates to StorageAdapterFactory for SRP compliance
   */
  createLocalStorageAdapter(): StorageAdapter | null {
    return StorageAdapterFactory.createLocalStorageAdapter()
  },

  /**
   * Create default sessionStorage adapter
   * Delegates to StorageAdapterFactory for SRP compliance
   */
  createSessionStorageAdapter(): StorageAdapter | null {
    return StorageAdapterFactory.createSessionStorageAdapter()
  },

  /**
   * Create default HTTP client using fetch
   * Delegates to HttpClientFactory for SRP compliance
   */
  createHttpClient(): HttpClient {
    return HttpClientFactory.createHttpClient()
  },

  /**
   * Create default document adapter
   * Delegates to DocumentAdapterFactory for SRP compliance
   */
  createDocumentAdapter(): DocumentAdapter | null {
    return DocumentAdapterFactory.createDocumentAdapter()
  },

  /**
   * Create default timer adapter
   * Delegates to TimerAdapterFactory for SRP compliance
   */
  createTimerAdapter(): TimerAdapter {
    return TimerAdapterFactory.createTimerAdapter()
  },

  /**
   * Create default WebSocket factory
   * Delegates to WebSocketFactoryFactory for SRP compliance
   */
  createWebSocketFactory(): WebSocketFactory {
    return WebSocketFactoryFactory.createWebSocketFactory()
  },

  /**
   * Create default window location adapter
   * Delegates to LocationAdapterFactory for SRP compliance
   */
  createWindowLocation(): WindowLocation | null {
    return LocationAdapterFactory.createWindowLocation()
  },

  /**
   * Create default console adapter
   * Delegates to ConsoleAdapterFactory for SRP compliance
   */
  createConsoleAdapter(): ConsoleAdapter {
    return ConsoleAdapterFactory.createConsoleAdapter()
  },

  /**
   * Create default environment adapter
   * Delegates to EnvironmentAdapterFactory for SRP compliance
   */
  createEnvironmentAdapter(): EnvironmentAdapter {
    return EnvironmentAdapterFactory.createEnvironmentAdapter()
  },
}

