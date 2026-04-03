import { useState, useMemo } from "react";
function useExecutionPagination({
  executions,
  itemsPerPage: initialItemsPerPage = 25,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const totalItems = executions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }
  const paginatedExecutions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return executions.slice(startIndex, endIndex);
  }, [executions, currentPage, itemsPerPage]);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
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
  };
}
export { useExecutionPagination };
