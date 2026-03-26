import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Tests for ErrorBoundary Component
 * Follows SOLID, DRY, and DIP principles
 */ import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import { logger } from '../utils/logger';
// Mock logger
jest.mock('../utils/logger', ()=>({
        logger: {
            error: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            info: jest.fn()
        }
    }));
// Component that throws an error
const ThrowError = ({ shouldThrow })=>{
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return /*#__PURE__*/ _jsx("div", {
        children: "No error"
    });
};
describe('ErrorBoundary', ()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
        // Suppress console.error for error boundary tests
        jest.spyOn(console, 'error').mockImplementation(()=>{});
    });
    afterEach(()=>{
        ;
        console.error.mockRestore();
    });
    it('should render children when no error', ()=>{
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx("div", {
                children: "Test content"
            })
        }));
        expect(screen.getByText('Test content')).toBeInTheDocument();
    });
    it('should render error UI when error occurs', ()=>{
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(/We're sorry/)).toBeInTheDocument();
    });
    it('should log error when caught', ()=>{
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        expect(logger.error).toHaveBeenCalledWith('ErrorBoundary caught an error:', expect.any(Error), expect.any(Object));
    });
    it('should call onError callback when provided', ()=>{
        const mockOnError = jest.fn();
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            onError: mockOnError,
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    });
    it('should display error message', ()=>{
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        expect(screen.getByText(/Error Details:/)).toBeInTheDocument();
        expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });
    it('should show stack trace in development mode', ()=>{
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        const details = screen.getByText('Stack Trace');
        expect(details).toBeInTheDocument();
        process.env.NODE_ENV = originalEnv;
    });
    it('should have Try Again button that can be clicked', ()=>{
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        // Verify Try Again button exists and can be clicked
        const tryAgainButton = screen.getByText('Try Again');
        expect(tryAgainButton).toBeInTheDocument();
        // Click should not throw an error
        expect(()=>{
            fireEvent.click(tryAgainButton);
        }).not.toThrow();
    });
    it('should render custom fallback when provided', ()=>{
        const customFallback = /*#__PURE__*/ _jsx("div", {
            children: "Custom error message"
        });
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            fallback: customFallback,
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
    it('should have Go Home button', ()=>{
        const originalLocation = window.location;
        delete window.location;
        window.location = {
            href: ''
        };
        render(/*#__PURE__*/ _jsx(ErrorBoundary, {
            children: /*#__PURE__*/ _jsx(ThrowError, {
                shouldThrow: true
            })
        }));
        const goHomeButton = screen.getByText('Go Home');
        expect(goHomeButton).toBeInTheDocument();
        fireEvent.click(goHomeButton);
        window.location = originalLocation;
    });
});
