import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Tests for useExecutionListQuery (Redux + redux-saga)
 */ import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import React from 'react';
import executionListReducer from '../../store/reducers/executionListReducer';
import { executionListSaga } from '../../store/sagas/executionListSagas';
import { useExecutionListQuery } from './useExecutionListQuery';
function createTestStore() {
    const saga = createSagaMiddleware();
    const store = configureStore({
        reducer: {
            executionList: executionListReducer
        },
        middleware: (g)=>g({
                thunk: false
            }).concat(saga)
    });
    saga.run(executionListSaga);
    return store;
}
describe('useExecutionListQuery', ()=>{
    let store;
    beforeEach(()=>{
        store = createTestStore();
    });
    const wrapper = ({ children })=>/*#__PURE__*/ _jsx(Provider, {
            store: store,
            children: children
        });
    it('should fetch executions successfully', async ()=>{
        const mockExecutions = [
            {
                execution_id: 'exec-1',
                workflow_id: 'workflow-1',
                status: 'completed',
                started_at: '2024-01-01T10:00:00Z',
                completed_at: '2024-01-01T10:00:05Z',
                node_states: {},
                variables: {},
                logs: []
            }
        ];
        const mockApiClient = {
            listExecutions: jest.fn().mockResolvedValue(mockExecutions)
        };
        const { result } = renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                filters: {
                    limit: 100
                }
            }), {
            wrapper
        });
        await waitFor(()=>{
            expect(result.current.isLoading).toBe(false);
        });
        expect(result.current.data).toEqual(mockExecutions);
        expect(result.current.error).toBeNull();
        expect(mockApiClient.listExecutions).toHaveBeenCalledWith({
            limit: 100
        });
    });
    it('should surface API errors', async ()=>{
        const mockError = new Error('API Error');
        const mockApiClient = {
            listExecutions: jest.fn().mockRejectedValue(mockError)
        };
        const { result } = renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                filters: {
                    limit: 100
                }
            }), {
            wrapper
        });
        await waitFor(()=>{
            expect(result.current.error).toBeTruthy();
        });
        expect(result.current.error).toBe(mockError);
    });
    it('should not fetch when apiClient is not provided', ()=>{
        const { result } = renderHook(()=>useExecutionListQuery({
                enabled: true
            }), {
            wrapper
        });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual([]);
    });
    it('should not fetch when enabled is false', ()=>{
        const mockApiClient = {
            listExecutions: jest.fn()
        };
        const { result } = renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                enabled: false
            }), {
            wrapper
        });
        expect(result.current.isLoading).toBe(false);
        expect(mockApiClient.listExecutions).not.toHaveBeenCalled();
    });
    it('should pass filters to API client', async ()=>{
        const mockApiClient = {
            listExecutions: jest.fn().mockResolvedValue([])
        };
        const filters = {
            status: 'completed',
            workflow_id: 'workflow-1',
            limit: 50,
            offset: 10
        };
        renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                filters
            }), {
            wrapper
        });
        await waitFor(()=>{
            expect(mockApiClient.listExecutions).toHaveBeenCalledWith(filters);
        });
    });
    it('should use default limit when not provided', async ()=>{
        const mockApiClient = {
            listExecutions: jest.fn().mockResolvedValue([])
        };
        renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                filters: {}
            }), {
            wrapper
        });
        await waitFor(()=>{
            expect(mockApiClient.listExecutions).toHaveBeenCalled();
        });
        const callArgs = mockApiClient.listExecutions.mock.calls[0][0];
        expect(callArgs.limit).toBe(100);
    });
    it('should refetch at specified interval', async ()=>{
        jest.useFakeTimers();
        const mockApiClient = {
            listExecutions: jest.fn().mockResolvedValue([])
        };
        renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                refetchInterval: 5000
            }), {
            wrapper
        });
        await waitFor(()=>{
            expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1);
        });
        await act(async ()=>{
            jest.advanceTimersByTime(5000);
        });
        await waitFor(()=>{
            expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(2);
        });
        jest.useRealTimers();
    });
    it('should not refetch when refetchInterval is 0', async ()=>{
        jest.useFakeTimers();
        const mockApiClient = {
            listExecutions: jest.fn().mockResolvedValue([])
        };
        renderHook(()=>useExecutionListQuery({
                apiClient: mockApiClient,
                refetchInterval: 0
            }), {
            wrapper
        });
        await waitFor(()=>{
            expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1);
        });
        await act(async ()=>{
            jest.advanceTimersByTime(10000);
        });
        expect(mockApiClient.listExecutions).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
    });
});
