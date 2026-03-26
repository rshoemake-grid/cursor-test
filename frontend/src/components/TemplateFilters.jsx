import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TemplateFilters Component
 * Provides filtering and sorting UI controls for marketplace templates
 * DRY: Derives category options from templateConstants
 */ import { TEMPLATE_CATEGORIES as CATEGORY_VALUES, formatCategory } from '../config/templateConstants';
function toTitleCase(s) {
    return s.split(' ').map((w)=>w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
const TEMPLATE_CATEGORIES = [
    {
        value: '',
        label: 'All Categories'
    },
    ...CATEGORY_VALUES.map((cat)=>({
            value: cat,
            label: toTitleCase(formatCategory(cat))
        }))
];
const SORT_OPTIONS = [
    {
        value: 'popular',
        label: 'Most Popular'
    },
    {
        value: 'recent',
        label: 'Most Recent'
    },
    {
        value: 'rating',
        label: 'Highest Rated'
    }
];
export function TemplateFilters({ category, searchQuery, sortBy, activeTab, onCategoryChange, onSearchChange, onSortChange, onSearch }) {
    return /*#__PURE__*/ _jsx("div", {
        className: "bg-white border-b border-gray-200 py-4",
        children: /*#__PURE__*/ _jsx("div", {
            className: "max-w-7xl mx-auto px-4",
            children: /*#__PURE__*/ _jsxs("div", {
                className: "flex flex-wrap items-center gap-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "category-select",
                                className: "text-sm font-medium text-gray-700 whitespace-nowrap",
                                children: "Category:"
                            }),
                            /*#__PURE__*/ _jsx("select", {
                                id: "category-select",
                                value: category,
                                onChange: (e)=>onCategoryChange(e.target.value),
                                className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                children: TEMPLATE_CATEGORIES.map((cat)=>/*#__PURE__*/ _jsx("option", {
                                        value: cat.value,
                                        children: cat.label
                                    }, cat.value))
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "flex-1 min-w-[200px]",
                        children: /*#__PURE__*/ _jsx("input", {
                            type: "text",
                            placeholder: activeTab === 'agents' ? "Search agents..." : activeTab === 'workflows-of-workflows' ? "Search workflows of workflows..." : "Search workflows...",
                            value: searchQuery,
                            onChange: (e)=>onSearchChange(e.target.value),
                            onKeyDown: (e)=>{
                                if (e.key === 'Enter') {
                                    onSearch();
                                }
                            },
                            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        })
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "sort-select",
                                className: "text-sm font-medium text-gray-700 whitespace-nowrap",
                                children: "Sort:"
                            }),
                            /*#__PURE__*/ _jsx("select", {
                                id: "sort-select",
                                value: sortBy,
                                onChange: (e)=>onSortChange(e.target.value),
                                className: "px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                children: SORT_OPTIONS.map((option)=>/*#__PURE__*/ _jsx("option", {
                                        value: option.value,
                                        children: option.label
                                    }, option.value))
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        onClick: onSearch,
                        className: "px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300",
                        children: "Search"
                    })
                ]
            })
        })
    });
}
