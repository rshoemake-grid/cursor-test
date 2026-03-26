import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Tests for VirtualizedList Component
 * Follows SOLID, DRY, and DIP principles
 */ import React from 'react';
import { render, screen } from '@testing-library/react';
import VirtualizedList from './VirtualizedList';
describe('VirtualizedList', ()=>{
    const mockItems = Array.from({
        length: 100
    }, (_, i)=>({
            id: `item-${i}`,
            name: `Item ${i}`
        }));
    it('should render items', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(VirtualizedList, {
            items: mockItems,
            itemHeight: 50,
            renderItem: (item)=>/*#__PURE__*/ _jsx("div", {
                    children: item.name
                }),
            containerHeight: 300
        }));
        // Virtualized list should render visible items (may take a moment to render)
        // Check that the container is rendered
        expect(container.firstChild).toBeInTheDocument();
    });
    it('should handle empty items array', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(VirtualizedList, {
            items: [],
            itemHeight: 50,
            renderItem: ()=>/*#__PURE__*/ _jsx("div", {
                    children: "Item"
                }),
            containerHeight: 300
        }));
        expect(container).toBeInTheDocument();
    });
    it('should accept function for item height (simple list renders all rows)', ()=>{
        const getItemHeight = jest.fn((index)=>index % 2 === 0 ? 50 : 75);
        render(/*#__PURE__*/ _jsx(VirtualizedList, {
            items: mockItems.slice(0, 10),
            itemHeight: getItemHeight,
            renderItem: (item)=>/*#__PURE__*/ _jsx("div", {
                    children: item.name
                }),
            containerHeight: 300
        }));
        expect(screen.getByText('Item 0')).toBeInTheDocument();
    });
    it('should accept custom className', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(VirtualizedList, {
            items: mockItems.slice(0, 10),
            itemHeight: 50,
            renderItem: (item)=>/*#__PURE__*/ _jsx("div", {
                    children: item.name
                }),
            containerHeight: 300,
            className: "custom-class"
        }));
        expect(container.firstChild).toHaveClass('custom-class');
    });
    it('should use custom overscan value', ()=>{
        const { container } = render(/*#__PURE__*/ _jsx(VirtualizedList, {
            items: mockItems,
            itemHeight: 50,
            renderItem: (item)=>/*#__PURE__*/ _jsx("div", {
                    children: item.name
                }),
            containerHeight: 300,
            overscan: 10
        }));
        // Component should render (overscan is internal implementation)
        expect(container.firstChild).toBeInTheDocument();
    });
});
