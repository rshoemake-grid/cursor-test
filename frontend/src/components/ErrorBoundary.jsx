function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Error Boundary Component
 * SOLID: Single Responsibility - only handles error catching and display
 * DRY: Reusable error boundary for the entire app
 */ import React, { Component } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../utils/logger';
class ErrorBoundary extends Component {
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        logger.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default error UI
            return /*#__PURE__*/ _jsx("div", {
                className: "min-h-screen bg-gray-50 flex items-center justify-center p-4",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center gap-3 mb-4",
                            children: [
                                /*#__PURE__*/ _jsx(AlertCircle, {
                                    className: "w-8 h-8 text-red-500"
                                }),
                                /*#__PURE__*/ _jsx("h1", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: "Something went wrong"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-gray-600 mb-6",
                            children: "We're sorry, but something unexpected happened. Please try refreshing the page or returning to the home page."
                        }),
                        this.state.error && /*#__PURE__*/ _jsxs("div", {
                            className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg",
                            children: [
                                /*#__PURE__*/ _jsx("p", {
                                    className: "text-sm font-medium text-red-800 mb-2",
                                    children: "Error Details:"
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    className: "text-sm text-red-700 font-mono",
                                    children: this.state.error.toString()
                                }),
                                process.env.NODE_ENV === 'development' && this.state.errorInfo && /*#__PURE__*/ _jsxs("details", {
                                    className: "mt-4",
                                    children: [
                                        /*#__PURE__*/ _jsx("summary", {
                                            className: "text-sm text-red-700 cursor-pointer",
                                            children: "Stack Trace"
                                        }),
                                        /*#__PURE__*/ _jsx("pre", {
                                            className: "mt-2 text-xs text-red-600 overflow-auto",
                                            children: this.state.errorInfo.componentStack
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex gap-3",
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    onClick: this.handleReset,
                                    className: "flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors",
                                    children: [
                                        /*#__PURE__*/ _jsx(RefreshCw, {
                                            className: "w-4 h-4"
                                        }),
                                        "Try Again"
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("button", {
                                    onClick: this.handleGoHome,
                                    className: "flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors",
                                    children: [
                                        /*#__PURE__*/ _jsx(Home, {
                                            className: "w-4 h-4"
                                        }),
                                        "Go Home"
                                    ]
                                })
                            ]
                        })
                    ]
                })
            });
        }
        return this.props.children;
    }
    constructor(props){
        super(props), _define_property(this, "handleReset", ()=>{
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        }), _define_property(this, "handleGoHome", ()=>{
            window.location.href = '/';
        });
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
}
/**
 * Error Boundary Component
 * Catches React component errors and displays a fallback UI
 */ export { ErrorBoundary as default };
