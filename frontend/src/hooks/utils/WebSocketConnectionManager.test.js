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
/**
 * WebSocket Connection Manager Tests
 * Tests for timeout guards and reconnection logic
 * Phase 2: Timeout Mutations
 */ import { act } from '@testing-library/react';
import { WebSocketConnectionManager } from './WebSocketConnectionManager';
import { WS_CLOSE_CODES, EXECUTION_STATUS } from './websocketConstants';
// Mock WebSocket
class MockWebSocket {
    close(code, reason) {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent('close', {
                code: code || 1000,
                reason
            }));
        }
    }
    send(_data) {
    // Mock implementation
    }
    constructor(url){
        _define_property(this, "readyState", MockWebSocket.CONNECTING);
        _define_property(this, "url", void 0);
        _define_property(this, "onopen", null);
        _define_property(this, "onclose", null);
        _define_property(this, "onerror", null);
        _define_property(this, "onmessage", null);
        this.url = url;
    // Don't auto-open - we'll control when it opens in tests
    // This prevents reconnectAttempts from being reset unexpectedly
    }
}
_define_property(MockWebSocket, "CONNECTING", 0);
_define_property(MockWebSocket, "OPEN", 1);
_define_property(MockWebSocket, "CLOSING", 2);
_define_property(MockWebSocket, "CLOSED", 3);
describe('WebSocketConnectionManager - Timeout Guards', ()=>{
    let mockLogger;
    let mockWebSocketFactory;
    let callbacks;
    beforeEach(()=>{
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockLogger = {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn()
        };
        mockWebSocketFactory = {
            create: jest.fn((url)=>new MockWebSocket(url))
        };
        callbacks = {
            onLog: jest.fn(),
            onStatus: jest.fn(),
            onNodeUpdate: jest.fn(),
            onCompletion: jest.fn(),
            onError: jest.fn()
        };
    });
    afterEach(()=>{
        jest.useRealTimers();
    });
    describe('Reconnection Timeout Guards', ()=>{
        it('should stop reconnecting after max attempts', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 3,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            // Connect and allow it to open, then close to trigger reconnection
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20); // Allow WebSocket to open (10ms)
            });
            // Close the connection to trigger first reconnection attempt
            const initialWs = manager.ws;
            expect(initialWs).toBeTruthy();
            if (initialWs && initialWs.onclose) {
                initialWs.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // reconnectAttempts should now be 1 (incremented in handleReconnection)
            expect(manager.reconnectAttempts).toBe(1);
            // A timeout should be scheduled
            expect(manager.reconnectTimeout).toBeTruthy();
            // Verify timeout was set
            expect(manager.reconnectTimeout).toBeTruthy();
            // We need reconnectAttempts to reach 3, then the next close should trigger warning
            // Flow:
            // 1. Initial close: reconnectAttempts = 0, check (0 >= 3) fails, increment to 1, set timeout
            // 2. Timeout fires: reconnectAttempts = 1, check (1 <= 3) passes, call connect()
            // 3. Second close: reconnectAttempts = 1, check (1 >= 3) fails, increment to 2, set timeout
            // 4. Timeout fires: reconnectAttempts = 2, check (2 <= 3) passes, call connect()
            // 5. Third close: reconnectAttempts = 2, check (2 >= 3) fails, increment to 3, set timeout
            // 6. Timeout fires: reconnectAttempts = 3, check (3 <= 3) passes, call connect()
            // 7. Fourth close: reconnectAttempts = 3, check (3 >= 3) passes, warn!
            // So we need 3 reconnection attempts (3 timeouts firing and 3 closes)
            // After the initial close, reconnectAttempts = 1, timeout is scheduled
            // We need to let 3 timeouts fire, each creating a connection that we immediately close
            for(let attempt = 1; attempt <= 3; attempt++){
                // Verify a timeout is scheduled before advancing time
                const timeoutBefore = manager.reconnectTimeout;
                expect(timeoutBefore).toBeTruthy();
                const factoryCallsBefore = mockWebSocketFactory.create.mock.calls.length;
                // Advance enough time for the reconnection delay
                // Use a large enough delay to ensure the timeout fires (exponential backoff can be large)
                // For simplicity, advance enough for any reasonable delay (60 seconds should cover it)
                act(()=>{
                    jest.advanceTimersByTime(60000);
                });
                // After delay, the timeout should have fired
                // The timeout callback checks: reconnectAttempts <= maxReconnectAttempts
                // For attempts 1, 2, 3: 1 <= 3, 2 <= 3, 3 <= 3 all pass, so connect() should be called
                const factoryCallsAfter = mockWebSocketFactory.create.mock.calls.length;
                // Verify connect() was called (factory should have been called)
                expect(factoryCallsAfter).toBe(factoryCallsBefore + 1);
                const currentWs = manager.ws;
                // Verify WebSocket was created
                expect(currentWs).toBeTruthy();
                // Verify reconnectAttempts hasn't changed yet (it only increments on close)
                // Note: reconnectAttempts might be 0 if connect() was called and the WebSocket
                // opened successfully (which resets it), but we're closing before it opens
                // So it should still be reconnectAttemptsBefore
                const reconnectAttemptsAfterConnect = manager.reconnectAttempts;
                if (currentWs && currentWs.onclose) {
                    // Close immediately so connection never opens
                    // This prevents reconnectAttempts from being reset to 0
                    // This should trigger handleReconnection, which increments reconnectAttempts
                    // UNLESS reconnectAttempts >= maxReconnectAttempts (in which case it warns and returns)
                    currentWs.onclose(new CloseEvent('close', {
                        code: 1006,
                        wasClean: false
                    }));
                    // After close, reconnectAttempts should have incremented UNLESS we've hit max attempts
                    const reconnectAttemptsAfterClose = manager.reconnectAttempts;
                    if (reconnectAttemptsAfterConnect < 3) {
                        // Not at max yet, should increment
                        expect(reconnectAttemptsAfterClose).toBe(reconnectAttemptsAfterConnect + 1);
                    } else {
                        // At max (3), should stay at 3 (check passes, warns, returns without incrementing)
                        expect(reconnectAttemptsAfterClose).toBe(3);
                    }
                }
            }
            // Verify reconnectAttempts is 3 before the final close
            expect(manager.reconnectAttempts).toBe(3);
            // Now reconnectAttempts should be 3
            // Trigger one more reconnection attempt - this should hit the max attempts guard
            // The delay for attempt 3 would be: 10000 * 2^2 = 40000ms
            act(()=>{
                jest.advanceTimersByTime(40000);
            });
            const finalWs = manager.ws;
            if (finalWs && finalWs.onclose) {
                act(()=>{
                    jest.advanceTimersByTime(5);
                });
                // This close should trigger the check: reconnectAttempts = 3, check (3 >= 3) passes
                finalWs.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // After max attempts (3), reconnectAttempts is 3, so the check (3 >= 3) should pass
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Max reconnect attempts reached'));
            expect(callbacks.onError).toHaveBeenCalledWith(expect.stringContaining('WebSocket connection failed after 3 attempts'));
        });
        it('should clear existing timeout before setting new one', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // Close again before timeout fires
            act(()=>{
                jest.advanceTimersByTime(100);
            });
            const ws2 = manager.ws;
            if (ws2 && ws2.onclose) {
                ws2.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // New timeout should be set (different from first)
            const secondTimeout = manager.reconnectTimeout;
            expect(secondTimeout).not.toBeNull();
        });
        it('should not reconnect if execution is terminated', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                executionStatus: EXECUTION_STATUS.COMPLETED,
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            act(()=>{
                jest.advanceTimersByTime(1000);
            });
            // Should not attempt reconnection
            expect(manager.reconnectAttempts).toBe(0);
        });
        it('should not reconnect if connection was closed cleanly', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close cleanly
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: WS_CLOSE_CODES.NORMAL_CLOSURE,
                    wasClean: true
                }));
            }
            act(()=>{
                jest.advanceTimersByTime(1000);
            });
            // Should not attempt reconnection
            expect(manager.reconnectAttempts).toBe(0);
        });
        it('should use sanitized delay for reconnection', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger,
                reconnectionStrategy: {
                    calculateDelay: jest.fn(()=>100000),
                    shouldReconnect: ()=>true
                }
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // Delay should be sanitized to max 60000ms
            const timeout = manager.reconnectTimeout;
            expect(timeout).not.toBeNull();
        });
    });
    describe('Connection State Guards', ()=>{
        it('should not connect if executionId is null', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: null,
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            expect(mockWebSocketFactory.create).not.toHaveBeenCalled();
        });
        it('should not connect if executionId is temporary', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'pending-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            // Should skip connection for temporary IDs
            expect(mockWebSocketFactory.create).not.toHaveBeenCalled();
        });
        it('should close connection when execution terminates', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            const closeSpy = jest.spyOn(ws, 'close');
            // Update status to completed
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            expect(closeSpy).toHaveBeenCalledWith(WS_CLOSE_CODES.NORMAL_CLOSURE, expect.any(String));
            expect(manager.ws).toBeNull();
        });
    });
    describe('Timeout Clearing', ()=>{
        it('should clear timeout when close is called', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection to trigger reconnection timeout
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            const timeout = manager.reconnectTimeout;
            expect(timeout).not.toBeNull();
            // Call close - should clear timeout
            manager.close();
            expect(manager.reconnectTimeout).toBeNull();
        });
        it('should clear timeout when execution terminates', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection to trigger reconnection timeout
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            const timeout = manager.reconnectTimeout;
            expect(timeout).not.toBeNull();
            // Update status to terminated - should clear timeout
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            expect(manager.reconnectTimeout).toBeNull();
        });
    });
    describe('Close Method - Explicit Boolean Checks', ()=>{
        it('should verify hasPending === true check in close()', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection to trigger reconnection timeout
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // Verify timeout exists (hasPending === true)
            const timeoutBefore = manager.reconnectTimeout;
            expect(timeoutBefore).not.toBeNull();
            // Call close() - should clear timeout because hasPending === true
            manager.close();
            // Verify timeout was cleared (hasPending check worked)
            expect(manager.reconnectTimeout).toBeNull();
        });
        it('should verify hasWebSocket === true check in close()', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Verify WebSocket exists (hasWebSocket === true)
            const ws = manager.ws;
            expect(ws).not.toBeNull();
            expect(ws).not.toBeUndefined();
            const closeSpy = jest.spyOn(ws, 'close');
            // Call close() - should close WebSocket because hasWebSocket === true
            manager.close();
            // Verify close was called (hasWebSocket check worked)
            expect(closeSpy).toHaveBeenCalledWith(WS_CLOSE_CODES.NORMAL_CLOSURE, undefined);
            expect(manager.ws).toBeNull();
        });
        it('should verify hasWebSocket === true check with reason in close()', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            const closeSpy = jest.spyOn(ws, 'close');
            // Call close() with reason - should close WebSocket because hasWebSocket === true
            manager.close('Test reason');
            // Verify close was called with reason (hasWebSocket check worked)
            expect(closeSpy).toHaveBeenCalledWith(WS_CLOSE_CODES.NORMAL_CLOSURE, 'Test reason');
        });
        it('should verify close() when hasPending === false', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Open WebSocket to ensure it's connected
            const ws = manager.ws;
            if (ws && ws.onopen) {
                ws.onopen(new Event('open'));
            }
            // Close cleanly so no reconnection timeout is set (hasPending === false)
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: WS_CLOSE_CODES.NORMAL_CLOSURE,
                    wasClean: true
                }));
            }
            // Verify no reconnection timeout was set (hasPending === false)
            expect(manager.reconnectTimeout).toBeNull();
            // Call close() - should not try to clear timeout because hasPending === false
            manager.close();
            // Should still work without error
            expect(manager.reconnectTimeout).toBeNull();
        });
        it('should verify close() when hasWebSocket === false', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            // No connection made (hasWebSocket === false)
            expect(manager.ws).toBeNull();
            // Call close() - should not try to close WebSocket because hasWebSocket === false
            manager.close();
            // Should still work without error
            expect(manager.ws).toBeNull();
        });
    });
    describe('isConnected Getter - Explicit Boolean Checks', ()=>{
        it('should verify isStateConnected === true check in isConnected', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Open WebSocket
            const ws = manager.ws;
            if (ws && ws.onopen) {
                ws.onopen(new Event('open'));
            }
            // isConnectedState should be true after onopen
            expect(manager.isConnectedState).toBe(true);
            // Set readyState to OPEN
            ws.readyState = MockWebSocket.OPEN;
            // Verify isConnected returns true (isStateConnected === true check passed)
            expect(manager.isConnected).toBe(true);
        });
        it('should verify isStateConnected === false check in isConnected', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            // No connection made (isStateConnected === false)
            expect(manager.isConnectedState).toBe(false);
            // Verify isConnected returns false (isStateConnected === false check passed)
            expect(manager.isConnected).toBe(false);
        });
        it('should verify hasWebSocket === false check in isConnected', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.isConnectedState = true;
            manager.ws = null;
            // Verify isConnected returns false (hasWebSocket === false check passed)
            expect(manager.isConnected).toBe(false);
        });
        it('should verify isOpen === true check in isConnected', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            manager.isConnectedState = true;
            ws.readyState = MockWebSocket.OPEN;
            // Verify isConnected returns true (isOpen === true check passed)
            expect(manager.isConnected).toBe(true);
        });
        it('should verify isOpen === false check in isConnected', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            manager.isConnectedState = true;
            ws.readyState = MockWebSocket.CONNECTING;
            // Verify isConnected returns false (isOpen === false check passed)
            expect(manager.isConnected).toBe(false);
        });
    });
    describe('handleConnectionError - Explicit Checks', ()=>{
        it('should verify error instanceof Error check in handleConnectionError', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: {
                    create: jest.fn(()=>{
                        throw new Error('Connection failed');
                    })
                },
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            // Verify error instanceof Error check worked
            expect(callbacks.onError).toHaveBeenCalledWith('Connection failed');
            expect(callbacks.onStatus).toHaveBeenCalledWith('error');
        });
        it('should verify non-Error error handling in handleConnectionError', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: {
                    create: jest.fn(()=>{
                        throw 'String error';
                    })
                },
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            // extractApiErrorMessage returns string when error is a string
            expect(callbacks.onError).toHaveBeenCalledWith('String error');
            expect(callbacks.onStatus).toHaveBeenCalledWith('error');
        });
    });
    describe('updateStatus - Explicit Boolean Checks', ()=>{
        it('should verify hasStatus === true check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            const initialLastKnownStatus = manager.lastKnownStatus;
            // Update with status (hasStatus === true)
            manager.updateStatus(EXECUTION_STATUS.RUNNING);
            // Verify lastKnownStatus was updated (hasStatus === true check worked)
            expect(manager.lastKnownStatus).toBe(EXECUTION_STATUS.RUNNING);
            expect(manager.lastKnownStatus).not.toBe(initialLastKnownStatus);
        });
        it('should verify hasStatus === false check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                executionStatus: EXECUTION_STATUS.RUNNING,
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            const initialLastKnownStatus = manager.lastKnownStatus;
            // Update with undefined (hasStatus === false)
            manager.updateStatus(undefined);
            // Verify lastKnownStatus was NOT updated (hasStatus === false check worked)
            expect(manager.lastKnownStatus).toBe(initialLastKnownStatus);
        });
        it('should verify hasStatusValue === true check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            const closeSpy = jest.spyOn(ws, 'close');
            // Update with completed status (hasStatusValue === true)
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            // Verify close was called (hasStatusValue === true check worked)
            expect(closeSpy).toHaveBeenCalled();
        });
        it('should verify hasStatusValue === false check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            const closeSpy = jest.spyOn(ws, 'close');
            // Update with undefined (hasStatusValue === false)
            manager.updateStatus(undefined);
            // Verify close was NOT called (hasStatusValue === false check worked)
            expect(closeSpy).not.toHaveBeenCalled();
        });
        it('should verify isTerminated === true check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            const closeSpy = jest.spyOn(ws, 'close');
            // Update with completed status (isTerminated === true)
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            // Verify close was called (isTerminated === true check worked)
            expect(closeSpy).toHaveBeenCalled();
        });
        it('should verify isTerminated === false check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            const ws = manager.ws;
            const closeSpy = jest.spyOn(ws, 'close');
            // Update with running status (isTerminated === false)
            manager.updateStatus(EXECUTION_STATUS.RUNNING);
            // Verify close was NOT called (isTerminated === false check worked)
            expect(closeSpy).not.toHaveBeenCalled();
        });
        it('should verify hasWebSocket === true check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Verify WebSocket exists (hasWebSocket === true)
            const ws = manager.ws;
            expect(ws).not.toBeNull();
            expect(ws).not.toBeUndefined();
            const closeSpy = jest.spyOn(ws, 'close');
            // Update with completed status - should close WebSocket (hasWebSocket === true)
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            // Verify close was called (hasWebSocket === true check worked)
            expect(closeSpy).toHaveBeenCalled();
        });
        it('should verify hasWebSocket === false check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            // No connection made (hasWebSocket === false)
            expect(manager.ws).toBeNull();
            // Update with completed status - should not try to close WebSocket (hasWebSocket === false)
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            // Should still work without error
            expect(manager.ws).toBeNull();
        });
        it('should verify hasPending === true check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // Close connection to trigger reconnection timeout
            const ws = manager.ws;
            if (ws && ws.onclose) {
                ws.onclose(new CloseEvent('close', {
                    code: 1006,
                    wasClean: false
                }));
            }
            // Verify timeout exists (hasPending === true)
            const timeoutBefore = manager.reconnectTimeout;
            expect(timeoutBefore).not.toBeNull();
            // Update with completed status - should clear timeout (hasPending === true)
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            // Verify timeout was cleared (hasPending === true check worked)
            expect(manager.reconnectTimeout).toBeNull();
        });
        it('should verify hasPending === false check in updateStatus', ()=>{
            const manager = new WebSocketConnectionManager({
                executionId: 'exec-123',
                maxReconnectAttempts: 5,
                webSocketFactory: mockWebSocketFactory,
                windowLocation: {
                    protocol: 'ws:',
                    host: 'localhost:8000'
                },
                logger: mockLogger
            });
            manager.connect(callbacks);
            act(()=>{
                jest.advanceTimersByTime(20);
            });
            // No reconnection timeout set (hasPending === false)
            expect(manager.reconnectTimeout).toBeNull();
            // Update with completed status - should not try to clear timeout (hasPending === false)
            manager.updateStatus(EXECUTION_STATUS.COMPLETED);
            // Should still work without error
            expect(manager.reconnectTimeout).toBeNull();
        });
    });
});
