/**
 * Repository Agents Data Hook
 * Single Responsibility: Only fetches and manages repository agents data
 */ import { useCallback } from 'react';
import { logger } from '../../utils/logger';
import { STORAGE_KEYS } from '../../config/constants';
import { applyFilters, sortItems } from './useMarketplaceData.utils';
import { isStorageAvailable } from '../utils/storageValidation';
/**
 * Hook for fetching repository agents data
 * Single Responsibility: Only handles repository agents fetching
 */ export function useRepositoryAgentsData({ storage, category, searchQuery, sortBy }) {
    const fetchRepositoryAgents = useCallback(async ()=>{
        // Load from storage
        // Use extracted validation function - mutation-resistant
        if (!isStorageAvailable(storage)) {
            return [];
        }
        // Try to parse storage data and catch JSON.parse errors
        let agentsData = [];
        try {
            const savedAgents = storage.getItem(STORAGE_KEYS.REPOSITORY_AGENTS);
            agentsData = savedAgents ? JSON.parse(savedAgents) : [];
        } catch (error) {
            // Log error with proper format (message + Error object)
            logger.error('Failed to load repository agents from storage:', error);
            agentsData = [];
        }
        // Apply filters and sort
        agentsData = applyFilters(agentsData, category, searchQuery);
        agentsData = sortItems(agentsData, sortBy);
        return agentsData;
    }, [
        storage,
        category,
        searchQuery,
        sortBy
    ]);
    return {
        fetchRepositoryAgents
    };
}
