import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Search Bar Component
 * SOLID: Single Responsibility - only handles search input
 * DRY: Reusable search component
 * DIP: Depends on props abstraction
 */ import { Search, X } from 'lucide-react';
/**
 * Search Bar Component
 * Provides a consistent search input with clear button
 */ export default function SearchBar({ value, placeholder = 'Search...', onChange, onClear, className = '' }) {
    const handleClear = ()=>{
        onChange('');
        onClear?.();
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: `relative ${className}`,
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                children: /*#__PURE__*/ _jsx(Search, {
                    className: "h-5 w-5 text-gray-400"
                })
            }),
            /*#__PURE__*/ _jsx("input", {
                type: "text",
                value: value,
                onChange: (e)=>onChange(e.target.value),
                placeholder: placeholder,
                className: "w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            }),
            value && /*#__PURE__*/ _jsx("button", {
                onClick: handleClear,
                className: "absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600",
                "aria-label": "Clear search",
                children: /*#__PURE__*/ _jsx(X, {
                    className: "h-5 w-5"
                })
            })
        ]
    });
}
