/**
 * Tools Data Hook
 * Single Responsibility: Only fetches and manages tools data
 * Uses localStorage (PUBLISHED_TOOLS) - backend API can be added later
 */
import { useCallback } from 'react';
import { getLocalStorageItem } from '../storage';
import { STORAGE_KEYS } from '../../config/constants';
import { applyFilters, sortItems } from './useMarketplaceData.utils';
/**
 * Hook for fetching tools data from localStorage
 * Backend API integration can be added when available
 */
export function useToolsData({ storage: _storage, category, searchQuery, sortBy }) {
    const fetchTools = useCallback(async ()=>{
        const toolsData = getLocalStorageItem(STORAGE_KEYS.PUBLISHED_TOOLS, []);
        const filtered = applyFilters(toolsData, category, searchQuery);
        return sortItems(filtered, sortBy, true);
    }, [
        category,
        searchQuery,
        sortBy
    ]);
    return {
        fetchTools
    };
}
