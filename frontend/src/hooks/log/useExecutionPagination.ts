/**
 * Custom Hook for Execution Pagination
 * SOLID: Single Responsibility - only manages pagination state
 * DRY: Reusable pagination logic
 * DIP: Depends on abstractions
 */

import { useState, useMemo } from 'react'
import type { ExecutionState } from '../../types/workflow'

export interface UseExecutionPaginationOptions {
  executions: ExecutionState[]
  itemsPerPage?: number
}

export interface UseExecutionPaginationResult {
  currentPage: number
  totalPages: number
  paginatedExecutions: ExecutionState[]
  setCurrentPage: (page: number) => void
  setItemsPerPage: (itemsPerPage: number) => void
  itemsPerPage: number
  startItem: number
  endItem: number
  totalItems: number
}

/**
 * Custom hook for paginating execution lists
 * 
 * @param options - Pagination options
 * @returns Pagination state and paginated data
 */
export function useExecutionPagination({
  executions,
  itemsPerPage: initialItemsPerPage = 25,
}: UseExecutionPaginationOptions): UseExecutionPaginationResult {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const totalItems = executions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Reset to page 1 if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  const paginatedExecutions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return executions.slice(startIndex, endIndex)
  }, [executions, currentPage, itemsPerPage])

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return {
    currentPage,
    totalPages,
    paginatedExecutions,
    setCurrentPage,
    setItemsPerPage,
    itemsPerPage,
    startItem,
    endItem,
    totalItems,
  }
}
