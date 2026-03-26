/**
 * Async Operation Hook
 * Handles async operations with loading, error, and success states
 * Follows Single Responsibility Principle
 */ import { useState, useCallback } from 'react';
import { logger } from '../../utils/logger';
/**
 * Generic hook for async operations with loading and error states
 * Single Responsibility: Only manages async operation state
 */ export function useAsyncOperation({ operation, onSuccess, onError, logger: injectedLogger = logger }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const execute = useCallback(async (...args)=>{
        setLoading(true);
        setError(null);
        try {
            // Guard: Add timeout to prevent hanging promises
            const timeoutPromise = new Promise((_, reject)=>{
                setTimeout(()=>reject(new Error('Operation timeout')), 30000); // 30 second timeout
            });
            const result = await Promise.race([
                operation(...args),
                timeoutPromise
            ]);
            onSuccess?.(result);
            return result;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            injectedLogger.error('Async operation failed:', error);
            onError?.(error);
            return null;
        } finally{
            setLoading(false);
        }
    }, [
        operation,
        onSuccess,
        onError,
        injectedLogger
    ]);
    const reset = useCallback(()=>{
        setError(null);
        setLoading(false);
    }, []);
    return {
        execute,
        loading,
        error,
        reset
    };
}
