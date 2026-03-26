/**
 * Debounce Hook
 * Generic hook for debouncing values
 * Single Responsibility: Only handles debouncing logic
 * DRY: Reusable debounce pattern
 */ import { useEffect, useRef } from 'react';
/**
 * Debounce a value
 * Mutation-resistant: explicit checks
 * 
 * @template T - Type of value being debounced
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 * @param callback - Callback to call after delay
 */ export function useDebounce(value, delay, callback) {
    const timeoutRef = useRef(null);
    useEffect(()=>{
        // Clear existing timeout
        if (timeoutRef.current !== null && timeoutRef.current !== undefined) {
            clearTimeout(timeoutRef.current);
        }
        // Set new timeout
        timeoutRef.current = setTimeout(()=>{
            callback(value);
        }, delay);
        // Cleanup
        return ()=>{
            if (timeoutRef.current !== null && timeoutRef.current !== undefined) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [
        value,
        delay,
        callback
    ]);
}
