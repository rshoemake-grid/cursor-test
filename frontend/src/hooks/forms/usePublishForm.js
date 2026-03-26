/**
 * Publish Form Hook
 * Centralized state management for workflow/agent publishing forms
 */ import { useState, useCallback } from 'react';
const DEFAULT_FORM_DATA = {
    name: '',
    description: '',
    category: 'automation',
    tags: '',
    difficulty: 'beginner',
    estimated_time: ''
};
/**
 * Hook for managing publish form state
 * 
 * @param options Configuration options
 * @returns Form state and handlers
 */ export function usePublishForm({ initialData, onReset } = {}) {
    const [form, setForm] = useState({
        ...DEFAULT_FORM_DATA,
        ...initialData
    });
    const updateField = useCallback((field, value)=>{
        setForm((prev)=>({
                ...prev,
                [field]: value
            }));
    }, []);
    const updateForm = useCallback((updates)=>{
        setForm((prev)=>({
                ...prev,
                ...updates
            }));
    }, []);
    const reset = useCallback(()=>{
        setForm(DEFAULT_FORM_DATA);
        if (onReset) {
            onReset();
        }
    }, [
        onReset
    ]);
    const resetToInitial = useCallback(()=>{
        setForm({
            ...DEFAULT_FORM_DATA,
            ...initialData
        });
    }, [
        initialData
    ]);
    return {
        form,
        setForm,
        updateField,
        updateForm,
        reset,
        resetToInitial
    };
}
