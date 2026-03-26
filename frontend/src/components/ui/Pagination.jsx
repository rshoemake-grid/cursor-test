import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Pagination Component
 * SOLID: Single Responsibility - only handles pagination UI
 * DRY: Reusable pagination component
 * DIP: Depends on props abstraction
 */ import { ChevronLeft, ChevronRight } from 'lucide-react';
const ITEMS_PER_PAGE_OPTIONS = [
    10,
    25,
    50,
    100
];
/**
 * Pagination Component
 * Provides pagination controls for data lists
 */ export default function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange, className = '' }) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const handlePrevious = ()=>{
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };
    const handleNext = ()=>{
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };
    const handlePageClick = (page)=>{
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };
    if (totalPages <= 1 && !onItemsPerPageChange) {
        return null;
    }
    // Generate page numbers to display
    const getPageNumbers = ()=>{
        const pages = [];
        const maxVisible = 7;
        if (totalPages <= maxVisible) {
            // Show all pages
            for(let i = 1; i <= totalPages; i++){
                pages.push(i);
            }
        } else {
            // Show first page
            pages.push(1);
            if (currentPage > 3) {
                pages.push('...');
            }
            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for(let i = start; i <= end; i++){
                pages.push(i);
            }
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            // Show last page
            pages.push(totalPages);
        }
        return pages;
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: `flex items-center justify-between ${className}`,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "text-sm text-gray-600",
                        children: [
                            "Showing ",
                            /*#__PURE__*/ _jsx("span", {
                                className: "font-medium",
                                children: startItem
                            }),
                            " to",
                            ' ',
                            /*#__PURE__*/ _jsx("span", {
                                className: "font-medium",
                                children: endItem
                            }),
                            " of",
                            ' ',
                            /*#__PURE__*/ _jsx("span", {
                                className: "font-medium",
                                children: totalItems
                            }),
                            " results"
                        ]
                    }),
                    onItemsPerPageChange && /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "items-per-page",
                                className: "text-sm text-gray-600",
                                children: "Per page:"
                            }),
                            /*#__PURE__*/ _jsx("select", {
                                id: "items-per-page",
                                value: itemsPerPage,
                                onChange: (e)=>onItemsPerPageChange(Number(e.target.value)),
                                className: "px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                children: ITEMS_PER_PAGE_OPTIONS.map((option)=>/*#__PURE__*/ _jsx("option", {
                                        value: option,
                                        children: option
                                    }, option))
                            })
                        ]
                    })
                ]
            }),
            totalPages > 1 && /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsx("button", {
                        onClick: handlePrevious,
                        disabled: currentPage === 1,
                        className: "p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors",
                        "aria-label": "Previous page",
                        children: /*#__PURE__*/ _jsx(ChevronLeft, {
                            className: "w-4 h-4"
                        })
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "flex items-center gap-1",
                        children: getPageNumbers().map((page, index)=>{
                            if (page === '...') {
                                return /*#__PURE__*/ _jsx("span", {
                                    className: "px-2 text-gray-500",
                                    children: "..."
                                }, `ellipsis-${index}`);
                            }
                            const pageNum = page;
                            const isActive = pageNum === currentPage;
                            return /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>handlePageClick(pageNum),
                                className: `px-3 py-1 rounded text-sm font-medium transition-colors ${isActive ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`,
                                "aria-label": `Go to page ${pageNum}`,
                                "aria-current": isActive ? 'page' : undefined,
                                children: pageNum
                            }, pageNum);
                        })
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        onClick: handleNext,
                        disabled: currentPage === totalPages,
                        className: "p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors",
                        "aria-label": "Next page",
                        children: /*#__PURE__*/ _jsx(ChevronRight, {
                            className: "w-4 h-4"
                        })
                    })
                ]
            })
        ]
    });
}
