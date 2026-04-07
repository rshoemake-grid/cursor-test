import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PaginationRoot,
  PaginationLeft,
  PaginationSummary,
  PaginationStrong,
  PaginationPerPage,
  PaginationLabel,
  PaginationSelect,
  PaginationNav,
  PaginationIconButton,
  PaginationPages,
  PaginationEllipsis,
  PaginationPageButton,
} from "../../styles/uiComponents.styled";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = "",
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  if (totalPages <= 1 && !onItemsPerPageChange) {
    return null;
  }
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };
  return (
    <PaginationRoot className={className}>
      <PaginationLeft>
        <PaginationSummary>
          Showing <PaginationStrong>{startItem}</PaginationStrong> to{" "}
          <PaginationStrong>{endItem}</PaginationStrong> of{" "}
          <PaginationStrong>{totalItems}</PaginationStrong> results
        </PaginationSummary>
        {onItemsPerPageChange && (
          <PaginationPerPage>
            <PaginationLabel htmlFor="items-per-page">Per page:</PaginationLabel>
            <PaginationSelect
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </PaginationSelect>
          </PaginationPerPage>
        )}
      </PaginationLeft>
      {totalPages > 1 && (
        <PaginationNav>
          <PaginationIconButton
            type="button"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden />
          </PaginationIconButton>
          <PaginationPages>
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <PaginationEllipsis key={`ellipsis-${index}`}>
                    ...
                  </PaginationEllipsis>
                );
              }
              const pageNum = page;
              const isActive = pageNum === currentPage;
              return (
                <PaginationPageButton
                  key={pageNum}
                  type="button"
                  $active={isActive}
                  onClick={() => handlePageClick(pageNum)}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isActive ? "page" : void 0}
                >
                  {pageNum}
                </PaginationPageButton>
              );
            })}
          </PaginationPages>
          <PaginationIconButton
            type="button"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden />
          </PaginationIconButton>
        </PaginationNav>
      )}
    </PaginationRoot>
  );
}
export { Pagination as default };
