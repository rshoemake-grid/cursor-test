/**
 * Templates Data Hook
 * Single Responsibility: Only fetches and manages templates data
 */ import { useCallback } from 'react';
import { buildSearchParams } from './useMarketplaceData.utils';
/**
 * Hook for fetching templates data
 * Single Responsibility: Only handles templates fetching
 */ export function useTemplatesData({ httpClient, apiBaseUrl, category, searchQuery, sortBy }) {
    const fetchTemplates = useCallback(async ()=>{
        const params = buildSearchParams(category, searchQuery, sortBy);
        const response = await httpClient.get(`${apiBaseUrl}/templates?${params}`);
        const data = await response.json();
        return data;
    }, [
        httpClient,
        apiBaseUrl,
        category,
        searchQuery,
        sortBy
    ]);
    return {
        fetchTemplates
    };
}
