import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Settings Header Component
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles header rendering and navigation
 */ import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
/**
 * Settings Header Component
 * DRY: Centralized header rendering logic
 */ export function SettingsHeader({ onSyncClick }) {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    return /*#__PURE__*/ _jsxs("div", {
        className: "mb-8",
        children: [
            /*#__PURE__*/ _jsxs("button", {
                onClick: ()=>navigate('/'),
                className: "mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors",
                children: [
                    /*#__PURE__*/ _jsx(ArrowLeft, {
                        className: "w-5 h-5"
                    }),
                    /*#__PURE__*/ _jsx("span", {
                        children: "Back to Main"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center justify-between mb-2",
                children: [
                    /*#__PURE__*/ _jsx("h1", {
                        className: "text-3xl font-bold text-gray-900",
                        children: "Settings"
                    }),
                    /*#__PURE__*/ _jsxs("button", {
                        onClick: onSyncClick,
                        className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsx(Save, {
                                className: "w-4 h-4"
                            }),
                            "Sync Now"
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("p", {
                className: "text-gray-600",
                children: "Configure LLM providers and workflow generation limits"
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "mt-4",
                children: /*#__PURE__*/ _jsx("p", {
                    className: "text-sm text-gray-500",
                    children: isAuthenticated ? `Signed in as ${user?.username || user?.email || 'your account'}` : 'Login to sync your LLM providers across devices.'
                })
            })
        ]
    });
}
