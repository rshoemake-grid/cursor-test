function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
// Shared test setup for useWebSocket tests
// Jest globals - no import needed
import { waitFor, act } from '@testing-library/react';
// Helper to ensure all waitFor calls have timeouts
export const waitForWithTimeout = (callback, timeout = 2000)=>{
    return waitFor(callback, {
        timeout
    });
};
// Helper to advance timers within act() to prevent React warnings
// This wraps jest.advanceTimersByTime in act() to handle React state updates
// Note: jest.advanceTimersByTime is synchronous, but we wrap it in act() to handle
// React state updates that may be triggered by timers (e.g., WebSocket onopen handlers)
export const advanceTimersByTime = async (ms)=>{
    await act(async ()=>{
        jest.advanceTimersByTime(ms);
    });
};
import { useWebSocket } from './useWebSocket';
import { logger } from '../../utils/logger';
// Mock logger
jest.mock('../../utils/logger', ()=>({
        logger: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        }
    }));
// Enhanced Mock WebSocket
export class MockWebSocket {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    send(_data) {
    // Mock send
    }
    /**
   * Closes the WebSocket connection.
   * @param code - Optional close code (defaults to 1000)
   * @param reason - Optional close reason string
   * @param wasClean - Optional flag indicating if the connection closed cleanly.
   *                   If not provided, will be calculated from code (code === 1000).
   *                   Allows tests to control wasClean independently of code.
   */ close(code, reason, wasClean) {
        // Clear any pending timers to prevent memory leaks
        this.clearTimers();
        this.readyState = MockWebSocket.CLOSING;
        // Use setTimeout - setImmediate is not available in Jest environment
        // This ensures the close event fires in fake timer environment
        // Track timer for cleanup
        const timer = setTimeout(()=>{
            this.readyState = MockWebSocket.CLOSED;
            if (this.onclose) {
                // Use the provided code or default to 1000
                const closeCode = code || 1000;
                // Use provided wasClean if available, otherwise calculate from code
                const wasCleanValue = wasClean !== undefined ? wasClean : closeCode === 1000;
                const event = new CloseEvent('close', {
                    code: closeCode,
                    reason: reason || '',
                    wasClean: wasCleanValue
                });
                this.onclose(event);
            }
            // Remove timer from array after execution
            const index = this.timers.indexOf(timer);
            if (index > -1) {
                this.timers.splice(index, 1);
            }
        }, 10);
        this.timers.push(timer);
    }
    // Clear all pending timers to prevent memory leaks
    clearTimers() {
        this.timers.forEach((timer)=>{
            clearTimeout(timer);
        });
        this.timers = [];
    }
    // Helper methods for testing
    simulateOpen() {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
            this.onopen(new Event('open'));
        }
    }
    simulateMessage(data) {
        if (this.onmessage) {
            const event = new MessageEvent('message', {
                data: JSON.stringify(data)
            });
            this.onmessage(event);
        }
    }
    simulateError(error) {
        if (this.onerror) {
            const event = new ErrorEvent('error', {
                error: error || new Error('WebSocket error')
            });
            this.onerror(event);
        }
    }
    /**
   * Simulates a WebSocket close event for testing.
   * Note: This method directly creates a CloseEvent and does not call close().
   * This allows precise control over the close event properties for testing.
   * @param code - Close code (defaults to 1000)
   * @param reason - Close reason string (defaults to empty string)
   * @param wasClean - Whether the connection closed cleanly (defaults to true)
   */ simulateClose(code = 1000, reason = '', wasClean = true) {
        // Clear timers when simulating close
        this.clearTimers();
        if (this.onclose) {
            // Create event object that properly preserves reason
            // jsdom's CloseEvent constructor may not preserve reason correctly
            // Note: This directly creates CloseEvent and does not call close() method
            const event = Object.create(CloseEvent.prototype);
            Object.defineProperties(event, {
                type: {
                    value: 'close',
                    enumerable: true
                },
                code: {
                    value: code,
                    enumerable: true
                },
                reason: {
                    value: reason || '',
                    enumerable: true
                },
                wasClean: {
                    value: wasClean,
                    enumerable: true
                },
                cancelBubble: {
                    value: false,
                    enumerable: true
                },
                defaultPrevented: {
                    value: false,
                    enumerable: true
                },
                timeStamp: {
                    value: Date.now(),
                    enumerable: true
                }
            });
            this.onclose(event);
        }
    }
    setReadyState(state) {
        this.readyState = state;
    }
    constructor(url){
        _define_property(this, "readyState", MockWebSocket.CONNECTING);
        _define_property(this, "url", void 0);
        _define_property(this, "onopen", null);
        _define_property(this, "onmessage", null);
        _define_property(this, "onerror", null);
        _define_property(this, "onclose", null);
        _define_property(this, "timers", []);
        this.url = url;
        // Simulate connection opening (but delay it to allow handler to be set)
        // Use setTimeout - setImmediate is not available in Jest environment
        // Track timer for cleanup to prevent memory leaks
        const timer = setTimeout(()=>{
            if (this.readyState === MockWebSocket.CONNECTING) {
                this.readyState = MockWebSocket.OPEN;
                if (this.onopen) {
                    this.onopen(new Event('open'));
                }
            }
            // Remove timer from array after execution
            const index = this.timers.indexOf(timer);
            if (index > -1) {
                this.timers.splice(index, 1);
            }
        }, 10);
        this.timers.push(timer);
    }
}
_define_property(MockWebSocket, "CONNECTING", 0);
_define_property(MockWebSocket, "OPEN", 1);
_define_property(MockWebSocket, "CLOSING", 2);
_define_property(MockWebSocket, "CLOSED", 3);
// Store WebSocket instances for testing
export const wsInstances = [];
// Replace global WebSocket
const OriginalWebSocket = global.WebSocket;
global.WebSocket = class extends MockWebSocket {
    constructor(url){
        super(url);
        wsInstances.push(this);
    }
};
// Export the original for cleanup if needed
export { OriginalWebSocket };
// Export useWebSocket and logger for tests
export { useWebSocket, logger };
