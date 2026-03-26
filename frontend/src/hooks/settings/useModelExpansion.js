/**
 * Model Expansion Hook
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles model expansion state
 */ import { useState, useCallback } from 'react';
/**
 * Hook for managing model expansion state
 * DRY: Centralized expansion logic
 */ export function useModelExpansion() {
    const [expandedModels, setExpandedModels] = useState({});
    const [expandedProviders, setExpandedProviders] = useState({});
    const toggleProviderModels = useCallback((providerId)=>{
        setExpandedProviders((prev)=>({
                ...prev,
                [providerId]: !prev[providerId]
            }));
    }, []);
    const toggleModel = useCallback((providerId, modelName)=>{
        setExpandedModels((prev)=>{
            const providerModels = prev[providerId] || new Set();
            const newSet = new Set(providerModels);
            if (newSet.has(modelName)) {
                newSet.delete(modelName);
            } else {
                newSet.add(modelName);
            }
            return {
                ...prev,
                [providerId]: newSet
            };
        });
    }, []);
    const isModelExpanded = useCallback((providerId, modelName)=>{
        const providerSet = expandedModels[providerId];
        if (!providerSet) {
            return false;
        }
        return providerSet.has(modelName);
    }, [
        expandedModels
    ]);
    return {
        expandedModels,
        expandedProviders,
        toggleProviderModels,
        toggleModel,
        isModelExpanded
    };
}
