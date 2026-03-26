import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Execution Details Modal Component
 * SOLID: Single Responsibility - only displays execution details
 * DRY: Reusable modal component
 * DIP: Depends on abstractions
 */ import { X, Clock, CheckCircle, XCircle, Play, AlertCircle, Download } from 'lucide-react';
import { useState } from 'react';
import { formatExecutionDuration } from '../../utils/executionFormat';
import ExecutionStatusBadge from '../ExecutionStatusBadge';
import { api } from '../../api/client';
import { logger } from '../../utils/logger';
import { extractApiErrorMessage } from '../../hooks/utils/apiUtils';
/**
 * Execution Details Modal Component
 * Displays detailed information about an execution
 */ export default function ExecutionDetailsModal({ execution, isOpen, onClose, apiClient = api }) {
    const [downloading, setDownloading] = useState(false);
    if (!isOpen || !execution) {
        return null;
    }
    const handleDownloadLogs = async (format)=>{
        if (!execution || downloading) return;
        try {
            setDownloading(true);
            const blob = await apiClient.downloadExecutionLogs(execution.execution_id, format);
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `execution_${execution.execution_id}_logs.${format === 'json' ? 'json' : 'txt'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            logger.error('Failed to download logs:', error);
            alert(`Failed to download logs: ${extractApiErrorMessage(error, 'Unknown error')}`);
        } finally{
            setDownloading(false);
        }
    };
    const getStatusIcon = (status)=>{
        switch(status){
            case 'completed':
                return /*#__PURE__*/ _jsx(CheckCircle, {
                    className: "w-5 h-5 text-green-500"
                });
            case 'failed':
                return /*#__PURE__*/ _jsx(XCircle, {
                    className: "w-5 h-5 text-red-500"
                });
            case 'running':
                return /*#__PURE__*/ _jsx(Play, {
                    className: "w-5 h-5 text-blue-500 animate-pulse"
                });
            case 'pending':
                return /*#__PURE__*/ _jsx(Clock, {
                    className: "w-5 h-5 text-yellow-500"
                });
            default:
                return /*#__PURE__*/ _jsx(AlertCircle, {
                    className: "w-5 h-5 text-gray-500"
                });
        }
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: "fixed inset-0 z-50 overflow-y-auto",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity",
                onClick: onClose
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "flex min-h-full items-center justify-center p-4",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-between p-6 border-b border-gray-200",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        getStatusIcon(execution.status),
                                        /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsx("h2", {
                                                    className: "text-2xl font-bold text-gray-900",
                                                    children: "Execution Details"
                                                }),
                                                /*#__PURE__*/ _jsx("p", {
                                                    className: "text-sm text-gray-500 font-mono",
                                                    children: execution.execution_id
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    onClick: onClose,
                                    className: "p-2 hover:bg-gray-100 rounded-lg transition-colors",
                                    "aria-label": "Close modal",
                                    children: /*#__PURE__*/ _jsx(X, {
                                        className: "w-5 h-5"
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "flex-1 overflow-y-auto p-6",
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("label", {
                                                        className: "text-sm font-medium text-gray-500",
                                                        children: "Status"
                                                    }),
                                                    /*#__PURE__*/ _jsx("div", {
                                                        className: "mt-1",
                                                        children: /*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                                                            status: execution.status
                                                        })
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("label", {
                                                        className: "text-sm font-medium text-gray-500",
                                                        children: "Workflow ID"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "mt-1 font-mono text-sm text-gray-900",
                                                        children: execution.workflow_id
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("label", {
                                                        className: "text-sm font-medium text-gray-500",
                                                        children: "Started At"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "mt-1 text-sm text-gray-900",
                                                        children: new Date(execution.started_at).toLocaleString()
                                                    })
                                                ]
                                            }),
                                            execution.completed_at && /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("label", {
                                                        className: "text-sm font-medium text-gray-500",
                                                        children: "Completed At"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "mt-1 text-sm text-gray-900",
                                                        children: new Date(execution.completed_at).toLocaleString()
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                children: [
                                                    /*#__PURE__*/ _jsx("label", {
                                                        className: "text-sm font-medium text-gray-500",
                                                        children: "Duration"
                                                    }),
                                                    /*#__PURE__*/ _jsx("p", {
                                                        className: "mt-1 text-sm text-gray-900",
                                                        children: formatExecutionDuration(execution.started_at, execution.completed_at)
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    execution.current_node && /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-sm font-medium text-gray-500",
                                                children: "Current Node"
                                            }),
                                            /*#__PURE__*/ _jsx("p", {
                                                className: "mt-1 text-sm text-gray-900 font-mono",
                                                children: execution.current_node
                                            })
                                        ]
                                    }),
                                    execution.error && /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-sm font-medium text-gray-500",
                                                children: "Error"
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "mt-1 p-3 bg-red-50 border border-red-200 rounded-lg",
                                                children: /*#__PURE__*/ _jsx("p", {
                                                    className: "text-sm text-red-800",
                                                    children: execution.error
                                                })
                                            })
                                        ]
                                    }),
                                    execution.node_states && Object.keys(execution.node_states).length > 0 && /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-sm font-medium text-gray-500 mb-2 block",
                                                children: "Node States"
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "space-y-2",
                                                children: Object.entries(execution.node_states).map(([nodeId, nodeState])=>/*#__PURE__*/ _jsxs("div", {
                                                        className: "p-3 bg-gray-50 border border-gray-200 rounded-lg",
                                                        children: [
                                                            /*#__PURE__*/ _jsxs("div", {
                                                                className: "flex items-center justify-between mb-1",
                                                                children: [
                                                                    /*#__PURE__*/ _jsx("span", {
                                                                        className: "font-mono text-sm font-medium text-gray-900",
                                                                        children: nodeId
                                                                    }),
                                                                    nodeState?.status && /*#__PURE__*/ _jsx(ExecutionStatusBadge, {
                                                                        status: nodeState.status,
                                                                        variant: "light"
                                                                    })
                                                                ]
                                                            }),
                                                            nodeState?.output && /*#__PURE__*/ _jsx("p", {
                                                                className: "text-xs text-gray-600 mt-1 line-clamp-2",
                                                                children: String(nodeState.output)
                                                            })
                                                        ]
                                                    }, nodeId))
                                            })
                                        ]
                                    }),
                                    execution.logs && execution.logs.length > 0 && /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-sm font-medium text-gray-500 mb-2 block",
                                                children: "Logs"
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto",
                                                children: execution.logs.map((log, index)=>/*#__PURE__*/ _jsx("div", {
                                                        className: "mb-1",
                                                        children: typeof log === 'string' ? log : JSON.stringify(log)
                                                    }, index))
                                            })
                                        ]
                                    }),
                                    execution.variables && Object.keys(execution.variables).length > 0 && /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "text-sm font-medium text-gray-500 mb-2 block",
                                                children: "Variables"
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "bg-gray-50 border border-gray-200 rounded-lg p-4",
                                                children: /*#__PURE__*/ _jsx("pre", {
                                                    className: "text-xs text-gray-700 overflow-x-auto",
                                                    children: JSON.stringify(execution.variables, null, 2)
                                                })
                                            })
                                        ]
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-between p-6 border-t border-gray-200",
                            children: [
                                /*#__PURE__*/ _jsx("div", {
                                    className: "flex items-center gap-2",
                                    children: execution.logs && execution.logs.length > 0 && /*#__PURE__*/ _jsxs(_Fragment, {
                                        children: [
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>handleDownloadLogs('text'),
                                                disabled: downloading,
                                                className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                                children: [
                                                    /*#__PURE__*/ _jsx(Download, {
                                                        className: "w-4 h-4"
                                                    }),
                                                    downloading ? 'Downloading...' : 'Download Logs (TXT)'
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("button", {
                                                onClick: ()=>handleDownloadLogs('json'),
                                                disabled: downloading,
                                                className: "flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                                children: [
                                                    /*#__PURE__*/ _jsx(Download, {
                                                        className: "w-4 h-4"
                                                    }),
                                                    downloading ? 'Downloading...' : 'Download Logs (JSON)'
                                                ]
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    onClick: onClose,
                                    className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors",
                                    children: "Close"
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
}
