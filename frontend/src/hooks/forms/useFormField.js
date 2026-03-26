import { useState, useEffect, useRef, useCallback } from 'react';
import { getNestedValue } from '../utils/formUtils';
import { nullishCoalesce } from '../utils/nullishCoalescing';
/**
 * Custom hook for managing form field state with node data synchronization
 */ export function useFormField(options) {
    const { initialValue, onUpdate, nodeData, dataPath, syncWithNodeData = true } = options;
    const [value, setValueState] = useState(()=>{
        if (nodeData && dataPath && syncWithNodeData) {
            const nodeValue = getNestedValue(nodeData, dataPath);
            return nullishCoalesce(nodeValue, initialValue);
        }
        return initialValue;
    });
    const inputRef = useRef(null);
    // Sync with nodeData changes (but not when user is actively editing)
    useEffect(()=>{
        if (!syncWithNodeData || !nodeData || !dataPath) {
            return;
        }
        // Don't update if the input is currently focused (user is typing)
        if (document.activeElement === inputRef.current) {
            return;
        }
        const nodeValue = getNestedValue(nodeData, dataPath);
        if (nodeValue !== undefined && nodeValue !== value) {
            setValueState(nodeValue);
        }
    }, [
        nodeData,
        dataPath,
        syncWithNodeData,
        value
    ]);
    const setValue = useCallback((newValue)=>{
        const valueToSet = typeof newValue === 'function' ? newValue(value) : newValue;
        setValueState(valueToSet);
        onUpdate(valueToSet);
    }, [
        value,
        onUpdate
    ]);
    return {
        value,
        setValue,
        inputRef
    };
}
/**
 * Simplified version for basic form fields without node data sync
 */ export function useSimpleFormField(initialValue, onUpdate) {
    return useFormField({
        initialValue,
        onUpdate,
        syncWithNodeData: false
    });
}
