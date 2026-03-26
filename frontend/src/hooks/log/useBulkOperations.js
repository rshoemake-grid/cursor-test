/**
 * Custom Hook for Bulk Operations
 * SOLID: Single Responsibility - only manages bulk selection state
 * DRY: Reusable bulk operations logic
 * DIP: Depends on abstractions
 */ import { useState, useCallback } from 'react';
/**
 * Custom hook for managing bulk operations on executions
 * 
 * @param options - Bulk operations options
 * @returns Bulk operations state and functions
 */ export function useBulkOperations({ executions, onDelete }) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const selectedCount = selectedIds.size;
    const isAllSelected = executions.length > 0 && selectedIds.size === executions.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < executions.length;
    const toggleSelection = useCallback((executionId)=>{
        setSelectedIds((prev)=>{
            const next = new Set(prev);
            if (next.has(executionId)) {
                next.delete(executionId);
            } else {
                next.add(executionId);
            }
            return next;
        });
    }, []);
    const toggleSelectAll = useCallback(()=>{
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(executions.map((e)=>e.execution_id)));
        }
    }, [
        executions,
        isAllSelected
    ]);
    const clearSelection = useCallback(()=>{
        setSelectedIds(new Set());
    }, []);
    const selectAll = useCallback(()=>{
        setSelectedIds(new Set(executions.map((e)=>e.execution_id)));
    }, [
        executions
    ]);
    const deleteSelected = useCallback(async ()=>{
        if (!onDelete || selectedIds.size === 0) {
            return;
        }
        setIsDeleting(true);
        try {
            await onDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        } catch (error) {
            throw error;
        } finally{
            setIsDeleting(false);
        }
    }, [
        onDelete,
        selectedIds
    ]);
    return {
        selectedIds,
        isAllSelected,
        isSomeSelected,
        selectedCount,
        toggleSelection,
        toggleSelectAll,
        clearSelection,
        selectAll,
        deleteSelected,
        isDeleting
    };
}
