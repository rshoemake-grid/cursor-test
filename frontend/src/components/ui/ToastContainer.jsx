import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Toast Container Component
 * SOLID: Single Responsibility - only manages toast list
 * DRY: Centralized toast management
 * DIP: Depends on abstractions
 */ import { useCallback } from 'react';
import Toast from './Toast';
/**
 * Toast Container Component
 * Manages and displays multiple toast notifications
 */ export default function ToastContainer({ toasts, onRemoveToast }) {
    const handleClose = useCallback((id)=>{
        onRemoveToast(id);
    }, [
        onRemoveToast
    ]);
    if (toasts.length === 0) {
        return null;
    }
    return /*#__PURE__*/ _jsx("div", {
        className: "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none",
        children: toasts.map((toast)=>/*#__PURE__*/ _jsx("div", {
                className: "pointer-events-auto",
                children: /*#__PURE__*/ _jsx(Toast, {
                    id: toast.id,
                    message: toast.message,
                    type: toast.type,
                    duration: toast.duration,
                    onClose: handleClose
                })
            }, toast.id))
    });
}
