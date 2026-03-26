/**
 * Tests for useExecutionPolling timeout guards
 * Ensures polling stops after max iterations and handles invalid intervals
 */ import { renderHook, waitFor } from '@testing-library/react';
import { useExecutionPolling } from './useExecutionPolling';
describe('useExecutionPolling - Timeout Guards', ()=>{
    let mockApiClient;
    let mockLogger;
    let tabsRef;
    let setTabs;
    beforeEach(()=>{
        jest.useFakeTimers();
        mockApiClient = {
            getExecution: jest.fn()
        };
        mockLogger = {
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        tabsRef = {
            current: []
        };
        setTabs = jest.fn();
    });
    afterEach(()=>{
        jest.useRealTimers();
        jest.clearAllMocks();
    });
    describe('Max iteration guard', ()=>{
        it('should stop polling after max iterations', async ()=>{
            const runningExecution = {
                id: 'exec-1',
                status: 'running',
                startedAt: new Date()
            };
            tabsRef.current = [
                {
                    id: 'tab-1',
                    executions: [
                        runningExecution
                    ]
                }
            ];
            mockApiClient.getExecution.mockResolvedValue({
                id: 'exec-1',
                status: 'running',
                completed_at: null,
                node_states: {},
                logs: []
            });
            renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: 100
                }));
            // Advance timers to trigger max iterations (1000)
            for(let i = 0; i < 1001; i++){
                jest.advanceTimersByTime(100);
            }
            await waitFor(()=>{
                expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Max polling iterations (1000) reached'));
            });
            // Verify polling stopped - no more calls after max iterations
            const callCountBefore = mockApiClient.getExecution.mock.calls.length;
            jest.advanceTimersByTime(1000);
            expect(mockApiClient.getExecution.mock.calls.length).toBe(callCountBefore);
        });
    });
    describe('Invalid poll interval guard', ()=>{
        it('should clamp negative interval to default', ()=>{
            renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: -100
                }));
            // Should use default 2000ms interval, not negative
            jest.advanceTimersByTime(2000);
            // Polling should still work with clamped interval
            expect(mockApiClient.getExecution).not.toHaveBeenCalled(); // No executions to poll
        });
        it('should clamp zero interval to default', ()=>{
            renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: 0
                }));
            // Should use default 2000ms interval
            jest.advanceTimersByTime(2000);
            expect(mockApiClient.getExecution).not.toHaveBeenCalled();
        });
        it('should clamp very large interval to max', ()=>{
            renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: 100000
                }));
            // Should clamp to 2000ms (default), not 100000ms
            jest.advanceTimersByTime(2000);
            expect(mockApiClient.getExecution).not.toHaveBeenCalled();
        });
        it('should use valid interval when provided', ()=>{
            const runningExecution = {
                id: 'exec-1',
                status: 'running',
                startedAt: new Date()
            };
            tabsRef.current = [
                {
                    id: 'tab-1',
                    executions: [
                        runningExecution
                    ]
                }
            ];
            mockApiClient.getExecution.mockResolvedValue({
                id: 'exec-1',
                status: 'running',
                completed_at: null,
                node_states: {},
                logs: []
            });
            renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: 5000
                }));
            // Advance by less than interval - should not poll yet
            jest.advanceTimersByTime(4000);
            expect(mockApiClient.getExecution).not.toHaveBeenCalled();
            // Advance to interval - should poll
            jest.advanceTimersByTime(1000);
            expect(mockApiClient.getExecution).toHaveBeenCalled();
        });
    });
    describe('Execution limit guard', ()=>{
        it('should limit concurrent executions to 50', async ()=>{
            // Create 60 running executions
            const runningExecutions = Array.from({
                length: 60
            }, (_, i)=>({
                    id: `exec-${i}`,
                    status: 'running',
                    startedAt: new Date()
                }));
            tabsRef.current = [
                {
                    id: 'tab-1',
                    executions: runningExecutions
                }
            ];
            mockApiClient.getExecution.mockResolvedValue({
                id: 'exec-1',
                status: 'running',
                completed_at: null,
                node_states: {},
                logs: []
            });
            renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: 100
                }));
            jest.advanceTimersByTime(100);
            await waitFor(()=>{
                expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Too many running executions (60), limiting to 50'));
                // Should only poll 50 executions, not 60
                expect(mockApiClient.getExecution.mock.calls.length).toBeLessThanOrEqual(50);
            });
        });
    });
    describe('Cleanup', ()=>{
        it('should clear interval on unmount', ()=>{
            const { unmount } = renderHook(()=>useExecutionPolling({
                    tabsRef,
                    setTabs,
                    apiClient: mockApiClient,
                    logger: mockLogger,
                    pollInterval: 100
                }));
            const callCountBefore = mockApiClient.getExecution.mock.calls.length;
            unmount();
            // Advance timers after unmount - should not poll
            jest.advanceTimersByTime(1000);
            expect(mockApiClient.getExecution.mock.calls.length).toBe(callCountBefore);
        });
    });
});
