import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from '@xyflow/react';
import { Database } from 'lucide-react';
export default function DatabaseNode({ data, selected }) {
    const executionStatus = data.executionStatus;
    const hasError = executionStatus === 'failed';
    const inputConfig = data.input_config || {};
    return /*#__PURE__*/ _jsxs("div", {
        className: `px-4 py-3 shadow-lg rounded-lg bg-white border-2 min-w-[200px] max-w-[200px] ${hasError ? 'border-red-500 border-4 shadow-xl ring-2 ring-red-200' : selected ? 'border-indigo-500 border-4 shadow-xl ring-2 ring-indigo-200' : 'border-indigo-300'}`,
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-2 mb-2",
                children: [
                    /*#__PURE__*/ _jsx("div", {
                        className: "p-1.5 bg-indigo-100 rounded flex-shrink-0",
                        children: /*#__PURE__*/ _jsx(Database, {
                            className: "w-4 h-4 text-indigo-600"
                        })
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "font-semibold text-sm text-gray-900 truncate flex-1 min-w-0",
                        children: String(data.label || 'Database')
                    })
                ]
            }),
            data.description && /*#__PURE__*/ _jsx("div", {
                className: "text-xs text-gray-500 mb-2 line-clamp-2 overflow-hidden",
                children: String(data.description)
            }),
            inputConfig.database_type && /*#__PURE__*/ _jsxs("div", {
                className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate",
                children: [
                    "Type: ",
                    inputConfig.database_type
                ]
            }),
            inputConfig.database_name && /*#__PURE__*/ _jsxs("div", {
                className: "text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1 truncate",
                children: [
                    "DB: ",
                    inputConfig.database_name
                ]
            }),
            inputConfig.mode && /*#__PURE__*/ _jsxs("div", {
                className: "text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded truncate",
                children: [
                    "Mode: ",
                    inputConfig.mode === 'write' ? 'Write' : 'Read'
                ]
            }),
            /*#__PURE__*/ _jsx(Handle, {
                type: "target",
                position: Position.Top,
                className: "w-3 h-3"
            }),
            /*#__PURE__*/ _jsx(Handle, {
                type: "source",
                position: Position.Bottom,
                className: "w-3 h-3"
            })
        ]
    });
}
