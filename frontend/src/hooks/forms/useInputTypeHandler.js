/**
 * Input Type Handler Hook
 * Extracted from FormField to eliminate DRY violations
 * Single Responsibility: Only handles input type-specific onChange logic
 */ import { useCallback } from 'react';
/**
 * Hook for handling input type-specific onChange events
 * DRY: Centralizes type-specific value conversion logic
 */ export function useInputTypeHandler(type, onChange) {
    return useCallback((e)=>{
        switch(type){
            case 'checkbox':
                onChange(e.target.checked);
                break;
            case 'number':
                onChange(Number(e.target.value));
                break;
            default:
                onChange(e.target.value);
                break;
        }
    }, [
        type,
        onChange
    ]);
}
