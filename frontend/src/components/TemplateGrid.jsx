import { jsx as _jsx } from "react/jsx-runtime";
/**
 * TemplateGrid Component
 * Renders a grid of template/agent cards with empty state handling
 * Performance: Memoized to prevent unnecessary re-renders when parent updates
 */ import { memo } from 'react';
import { TemplateCard } from './TemplateCard';
export const TemplateGrid = /*#__PURE__*/ memo(function TemplateGrid({ items, selectedIds, type, onToggleSelect, onCardClick, getDifficultyColor, emptyMessage = 'No items found. Try adjusting your filters.', footerText }) {
    if (items.length === 0) {
        return /*#__PURE__*/ _jsx("div", {
            className: "text-center py-12",
            children: /*#__PURE__*/ _jsx("p", {
                className: "text-gray-600",
                children: emptyMessage
            })
        });
    }
    // Filter out duplicates by ID to prevent React key warnings
    const uniqueItems = items.filter((item, index, self)=>index === self.findIndex((t)=>t.id === item.id));
    return /*#__PURE__*/ _jsx("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        children: uniqueItems.map((item, index)=>{
            const isSelected = selectedIds.has(item.id);
            // Use combination of id and index to ensure unique keys even if duplicates slip through
            return /*#__PURE__*/ _jsx(TemplateCard, {
                item: item,
                isSelected: isSelected,
                type: type,
                onToggleSelect: onToggleSelect,
                onClick: onCardClick,
                getDifficultyColor: getDifficultyColor,
                footerText: footerText
            }, `${item.id}-${index}`);
        })
    });
});
