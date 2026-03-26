import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Handle, Position } from '@xyflow/react';
import { Flag } from 'lucide-react';
export default function EndNode({ selected }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: `px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 border-2 ${selected ? 'border-gray-800 border-4 shadow-xl ring-2 ring-gray-300' : 'border-gray-700'}`,
        children: [
            /*#__PURE__*/ _jsx(Handle, {
                type: "target",
                position: Position.Top,
                className: "w-3 h-3"
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsx(Flag, {
                        className: "w-4 h-4 text-white"
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "font-semibold text-sm text-white",
                        children: "End"
                    })
                ]
            })
        ]
    });
}
