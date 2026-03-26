/**
 * Settings State Sync Hook
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles state synchronization from hook-loaded values
 */ import { useEffect } from 'react';
/**
 * Hook for synchronizing settings state from loaded values
 * DRY: Centralized state sync logic
 */ export function useSettingsStateSync(options) {
    const { loadedProviders, loadedIterationLimit, loadedDefaultModel, providers, iterationLimit, defaultModel, settingsLoaded, setProviders, setIterationLimit, setDefaultModel, setSettingsLoaded, onLoadComplete } = options;
    // Sync providers when loaded
    useEffect(()=>{
        if (loadedProviders.length > 0 && providers.length === 0) {
            setProviders(loadedProviders);
        }
    }, [
        loadedProviders,
        providers.length,
        setProviders
    ]);
    // Sync iteration limit when loaded
    useEffect(()=>{
        if (typeof loadedIterationLimit === 'number' && iterationLimit === 10) {
            setIterationLimit(loadedIterationLimit);
        }
    }, [
        loadedIterationLimit,
        iterationLimit,
        setIterationLimit
    ]);
    // Sync default model when loaded
    useEffect(()=>{
        if (loadedDefaultModel && !defaultModel) {
            setDefaultModel(loadedDefaultModel);
        }
    }, [
        loadedDefaultModel,
        defaultModel,
        setDefaultModel
    ]);
    // Call onLoadComplete callback when all values are loaded
    useEffect(()=>{
        if (onLoadComplete && loadedProviders.length > 0 && !settingsLoaded) {
            onLoadComplete({
                providers: loadedProviders,
                iteration_limit: loadedIterationLimit,
                default_model: loadedDefaultModel
            });
            setSettingsLoaded(true);
        }
    }, [
        loadedProviders,
        loadedIterationLimit,
        loadedDefaultModel,
        onLoadComplete,
        setSettingsLoaded,
        settingsLoaded
    ]);
}
