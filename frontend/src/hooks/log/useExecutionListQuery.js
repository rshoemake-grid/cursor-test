/**
 * Execution list loading via Redux + redux-saga (replaces @tanstack/react-query).
 */ import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logger } from '../../utils/logger';
import { executionListActions } from '../../store/actions/executionListActions';
import { selectExecutionListItems, selectExecutionListLoading, selectExecutionListError } from '../../store/selectors/executionListSelectors';
export function useExecutionListQuery({ apiClient, filters, enabled = true, refetchInterval = 5000 } = {}) {
    const dispatch = useDispatch();
    const items = useSelector(selectExecutionListItems);
    const loading = useSelector(selectExecutionListLoading);
    const error = useSelector(selectExecutionListError);
    const apiRef = useRef(apiClient);
    apiRef.current = apiClient;
    const filtersKey = JSON.stringify(filters ?? {});
    const refetch = useCallback(()=>{
        const client = apiRef.current;
        if (!client) {
            logger.error('useExecutionListQuery: API client not provided');
            return;
        }
        const parsed = filtersKey ? JSON.parse(filtersKey) : {};
        dispatch(executionListActions.fetchRequest({
            filters: parsed,
            apiClient: client
        }));
    }, [
        dispatch,
        filtersKey
    ]);
    useEffect(()=>{
        if (!enabled || !apiClient) return;
        refetch();
        if (refetchInterval > 0) {
            const id = window.setInterval(refetch, refetchInterval);
            return ()=>window.clearInterval(id);
        }
    }, [
        enabled,
        apiClient,
        refetch,
        refetchInterval
    ]);
    return {
        data: items,
        isLoading: loading,
        error: error || null,
        refetch
    };
}
