import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Scrollable list (virtual scrolling removed — @tanstack/react-virtual dropped).
 */ import { useRef } from 'react';
/**
 * Renders all items in a scroll container. For very large lists, consider pagination.
 */ export default function VirtualizedList({ items, itemHeight: _itemHeight, renderItem, containerHeight = 600, className = '' }) {
    const parentRef = useRef(null);
    return /*#__PURE__*/ _jsx("div", {
        ref: parentRef,
        className: `overflow-auto ${className}`,
        style: {
            height: containerHeight
        },
        children: /*#__PURE__*/ _jsx("div", {
            children: items.map((item, index)=>/*#__PURE__*/ _jsx("div", {
                    children: renderItem(item, index)
                }, index))
        })
    });
}
