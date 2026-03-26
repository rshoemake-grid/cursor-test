import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Marketplace Tab Button Component Tests
 * Tests for tab button component rendering and interactions
 */ import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketplaceTabButton } from './MarketplaceTabButton';
import { Home, Settings } from 'lucide-react';
describe('MarketplaceTabButton', ()=>{
    const mockOnClick = jest.fn();
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    it('should render with label and icon', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        expect(screen.getByText('Test Tab')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
    it('should call onClick when clicked', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
    it('should apply active styles when isActive is true', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Active Tab",
            icon: Home,
            isActive: true,
            onClick: mockOnClick
        }));
        const button = screen.getByRole('button');
        expect(button).toHaveClass('text-primary-600', 'border-b-2', 'border-primary-600');
    });
    it('should apply inactive styles when isActive is false', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Inactive Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        const button = screen.getByRole('button');
        expect(button).toHaveClass('text-gray-600', 'hover:text-gray-900');
        expect(button).not.toHaveClass('text-primary-600', 'border-b-2');
    });
    it('should use default icon size when not provided', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        const icon = screen.getByRole('button').querySelector('svg');
        expect(icon).toHaveClass('w-5', 'h-5');
    });
    it('should use custom icon size when provided', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick,
            iconSize: "w-4 h-4"
        }));
        const icon = screen.getByRole('button').querySelector('svg');
        expect(icon).toHaveClass('w-4', 'h-4');
        expect(icon).not.toHaveClass('w-5', 'h-5');
    });
    it('should render different icons correctly', ()=>{
        const { rerender } = render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Home Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        expect(screen.getByText('Home Tab')).toBeInTheDocument();
        rerender(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Settings Tab",
            icon: Settings,
            isActive: false,
            onClick: mockOnClick
        }));
        expect(screen.getByText('Settings Tab')).toBeInTheDocument();
    });
    it('should have correct button structure', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        const button = screen.getByRole('button');
        expect(button).toHaveClass('px-6', 'py-3', 'text-sm', 'font-medium', 'flex', 'items-center', 'gap-2');
    });
    it('should handle multiple clicks', ()=>{
        render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
    it('should transition between active and inactive states', ()=>{
        const { rerender } = render(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: false,
            onClick: mockOnClick
        }));
        let button = screen.getByRole('button');
        expect(button).not.toHaveClass('text-primary-600');
        rerender(/*#__PURE__*/ _jsx(MarketplaceTabButton, {
            label: "Test Tab",
            icon: Home,
            isActive: true,
            onClick: mockOnClick
        }));
        button = screen.getByRole('button');
        expect(button).toHaveClass('text-primary-600', 'border-b-2', 'border-primary-600');
    });
});
