/**
 * Provider Management Hook
 * Single Responsibility: Only manages LLM provider state and operations
 * DRY: Reusable provider management logic
 */ import { useState, useCallback } from 'react';
import { logicalOrToEmptyArray } from '../utils/logicalOr';
export function useProviderManagement({ service, providers, setProviders, iterationLimit, defaultModel, token }) {
    const [testingProvider, setTestingProvider] = useState(null);
    const [testResults, setTestResults] = useState({});
    const saveProviders = useCallback(async (newProviders)=>{
        const settings = {
            providers: newProviders,
            iteration_limit: iterationLimit,
            default_model: defaultModel
        };
        setProviders(newProviders);
        await service.saveSettings(settings, token);
    }, [
        service,
        token,
        iterationLimit,
        defaultModel,
        setProviders
    ]);
    const updateProvider = useCallback((id, updates)=>{
        saveProviders(providers.map((p)=>p.id === id ? {
                ...p,
                ...updates
            } : p));
    }, [
        providers,
        saveProviders
    ]);
    const testProvider = useCallback(async (provider)=>{
        setTestingProvider(provider.id);
        setTestResults((prev)=>({
                ...prev,
                [provider.id]: undefined
            }));
        try {
            const result = await service.testProvider(provider);
            setTestResults((prev)=>({
                    ...prev,
                    [provider.id]: result
                }));
        } finally{
            setTestingProvider(null);
        }
    }, [
        service
    ]);
    const addCustomModel = useCallback((providerId, modelName)=>{
        const provider = providers.find((p)=>p.id === providerId);
        if (provider && modelName) {
            updateProvider(providerId, {
                models: [
                    ...logicalOrToEmptyArray(provider.models),
                    modelName
                ]
            });
        }
    }, [
        providers,
        updateProvider
    ]);
    return {
        saveProviders,
        updateProvider,
        testProvider,
        addCustomModel,
        testingProvider,
        testResults
    };
}
