import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TabBar Component
 * Renders the tab bar UI for workflow tabs
 */ import { X, Plus } from 'lucide-react';
export function TabBar({ tabs, activeTabId, editingTabId, editingName, editingInputRef, setEditingName, onTabClick, onTabDoubleClick, onCloseTab, onInputBlur, onInputKeyDown, onNewWorkflow, onSave, onExecute, onPublish, onExport }) {
    return /*#__PURE__*/ _jsxs("div", {
        className: "flex items-center bg-gray-100 border-b border-gray-300 px-2",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "flex items-center flex-1 overflow-x-auto",
                children: tabs.map((tab)=>/*#__PURE__*/ _jsxs("button", {
                        onClick: ()=>onTabClick(tab.id),
                        onDoubleClick: (event)=>onTabDoubleClick(tab, event),
                        className: `
              flex items-center gap-2 px-4 py-2 border-r border-gray-300 
              transition-colors relative group
              ${tab.id === activeTabId ? 'bg-white text-gray-900 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `,
                        children: [
                            tab.isUnsaved && /*#__PURE__*/ _jsx("div", {
                                className: "w-2 h-2 bg-blue-500 rounded-full",
                                title: "Unsaved changes"
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                className: "text-sm whitespace-nowrap",
                                children: editingTabId === tab.id ? /*#__PURE__*/ _jsx("input", {
                                    ref: editingInputRef,
                                    value: editingName,
                                    onChange: (event)=>setEditingName(event.target.value),
                                    onBlur: ()=>onInputBlur(tab.id),
                                    onKeyDown: (event)=>onInputKeyDown(tab.id, event),
                                    onClick: (event)=>event.stopPropagation(),
                                    className: "w-full text-sm bg-transparent border-b border-blue-400 focus:border-blue-500 focus:outline-none"
                                }) : tab.name
                            }),
                            tabs.length > 1 && /*#__PURE__*/ _jsx("div", {
                                onClick: (e)=>onCloseTab(tab.id, e),
                                className: "opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded p-0.5 transition-opacity cursor-pointer",
                                title: "Close tab",
                                role: "button",
                                tabIndex: 0,
                                onKeyDown: (e)=>{
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onCloseTab(tab.id, e);
                                    }
                                },
                                children: /*#__PURE__*/ _jsx(X, {
                                    className: "w-3 h-3"
                                })
                            })
                        ]
                    }, tab.id))
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                    /*#__PURE__*/ _jsx("button", {
                        onClick: onSave,
                        className: "px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
                        title: "Save workflow",
                        children: "Save"
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        onClick: onExecute,
                        className: "px-3 py-1 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors",
                        title: "Execute workflow",
                        children: "Execute"
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        onClick: onPublish,
                        className: "px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors",
                        title: "Publish workflow",
                        children: "Publish"
                    }),
                    /*#__PURE__*/ _jsx("button", {
                        onClick: onExport,
                        className: "px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
                        title: "Export workflow",
                        children: "Export"
                    }),
                    /*#__PURE__*/ _jsxs("button", {
                        onClick: onNewWorkflow,
                        className: "flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 transition-colors",
                        title: "New workflow",
                        children: [
                            /*#__PURE__*/ _jsx(Plus, {
                                className: "w-4 h-4"
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                className: "text-sm font-medium",
                                children: "New"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
