import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
// import ExecutionStatusBadge from './ExecutionStatusBadge' // Unused
import { getExecutionStatusColorLight } from '../utils/executionStatus';
import { logger } from '../utils/logger';
// Domain-based imports - Phase 7
import { useWorkflowAPI } from '../hooks/workflow';
export default function ExecutionViewer({ executionId }) {
    const [execution, setExecution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const { getExecution } = useWorkflowAPI();
    useEffect(()=>{
        loadExecution();
        // Poll for updates every 2 seconds if still running
        const interval = setInterval(()=>{
            if (execution?.status === 'running' || execution?.status === 'pending') {
                setIsPolling(true);
                loadExecution();
            } else {
                setIsPolling(false);
            }
        }, 2000);
        return ()=>clearInterval(interval);
    }, [
        executionId,
        execution?.status,
        getExecution
    ]);
    const loadExecution = async ()=>{
        try {
            const data = await getExecution(executionId);
            setExecution(data);
            setIsPolling(data.status === 'running' || data.status === 'pending');
        } catch (error) {
            logger.error('Failed to load execution:', error);
        } finally{
            setLoading(false);
        }
    };
    if (loading) {
        return /*#__PURE__*/ _jsx("div", {
            className: "flex items-center justify-center h-full",
            children: /*#__PURE__*/ _jsx("div", {
                className: "text-gray-500",
                children: "Loading execution..."
            })
        });
    }
    if (!execution) {
        return /*#__PURE__*/ _jsx("div", {
            className: "flex items-center justify-center h-full",
            children: /*#__PURE__*/ _jsx("div", {
                className: "text-red-500",
                children: "Execution not found"
            })
        });
    }
    const getStatusIcon = (status)=>{
        switch(status){
            case 'completed':
                return /*#__PURE__*/ _jsx(CheckCircle, {
                    className: "w-5 h-5 text-green-600"
                });
            case 'failed':
                return /*#__PURE__*/ _jsx(XCircle, {
                    className: "w-5 h-5 text-red-600"
                });
            case 'running':
                return /*#__PURE__*/ _jsx(Clock, {
                    className: "w-5 h-5 text-blue-600 animate-spin"
                });
            default:
                return /*#__PURE__*/ _jsx(AlertCircle, {
                    className: "w-5 h-5 text-gray-600"
                });
        }
    };
    // Use utility function instead of local function
    const getStatusColor = (status)=>getExecutionStatusColorLight(status);
    return /*#__PURE__*/ _jsx("div", {
        className: "h-full overflow-y-auto p-6",
        children: /*#__PURE__*/ _jsxs("div", {
            className: "max-w-5xl mx-auto",
            children: [
                isPolling && (execution.status === 'running' || execution.status === 'pending') && /*#__PURE__*/ _jsx("div", {
                    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-4 mb-6 animate-pulse",
                    children: /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ _jsx(Clock, {
                                        className: "w-6 h-6 animate-spin"
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "font-semibold text-lg",
                                                children: "Workflow Running..."
                                            }),
                                            /*#__PURE__*/ _jsx("div", {
                                                className: "text-sm text-blue-100",
                                                children: "Monitoring in real-time • Updates every 2 seconds"
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ _jsx("div", {
                                        className: "w-2 h-2 bg-white rounded-full animate-pulse"
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        className: "text-sm font-medium",
                                        children: "LIVE"
                                    })
                                ]
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "bg-white rounded-lg shadow-md p-6 mb-6",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-between mb-4",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: "Execution Details"
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: `px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(execution.status)}`,
                                    children: [
                                        getStatusIcon(execution.status),
                                        execution.status.toUpperCase()
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "grid grid-cols-2 gap-4 text-sm",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "text-gray-600",
                                            children: "Execution ID:"
                                        }),
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "ml-2 font-mono text-gray-900",
                                            children: execution.execution_id
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "text-gray-600",
                                            children: "Workflow ID:"
                                        }),
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "ml-2 font-mono text-gray-900",
                                            children: execution.workflow_id
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "text-gray-600",
                                            children: "Started:"
                                        }),
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "ml-2 text-gray-900",
                                            children: new Date(execution.started_at).toLocaleString()
                                        })
                                    ]
                                }),
                                execution.completed_at && /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "text-gray-600",
                                            children: "Completed:"
                                        }),
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "ml-2 text-gray-900",
                                            children: new Date(execution.completed_at).toLocaleString()
                                        })
                                    ]
                                })
                            ]
                        }),
                        execution.error && /*#__PURE__*/ _jsx("div", {
                            className: "mt-4 p-3 bg-red-50 border border-red-200 rounded-lg",
                            children: /*#__PURE__*/ _jsxs("p", {
                                className: "text-sm text-red-800",
                                children: [
                                    /*#__PURE__*/ _jsx("strong", {
                                        children: "Error:"
                                    }),
                                    " ",
                                    execution.error
                                ]
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "bg-white rounded-lg shadow-md p-6 mb-6",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-between mb-4",
                            children: [
                                /*#__PURE__*/ _jsx("h3", {
                                    className: "text-lg font-semibold text-gray-900",
                                    children: "Node Execution"
                                }),
                                execution.node_states && Object.keys(execution.node_states).length > 0 && /*#__PURE__*/ _jsxs("div", {
                                    className: "text-sm text-gray-600",
                                    children: [
                                        Object.values(execution.node_states).filter((n)=>n.status === 'completed').length,
                                        " / ",
                                        Object.keys(execution.node_states).length,
                                        " nodes completed"
                                    ]
                                })
                            ]
                        }),
                        execution.node_states && Object.keys(execution.node_states).length > 0 && /*#__PURE__*/ _jsx("div", {
                            className: "mb-4",
                            children: /*#__PURE__*/ _jsx("div", {
                                className: "w-full bg-gray-200 rounded-full h-2",
                                children: /*#__PURE__*/ _jsx("div", {
                                    className: "bg-blue-600 h-2 rounded-full transition-all duration-500",
                                    style: {
                                        width: `${Object.values(execution.node_states).filter((n)=>n.status === 'completed').length / Object.keys(execution.node_states).length * 100}%`
                                    }
                                })
                            })
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(execution.node_states).map(([nodeId, nodeState])=>/*#__PURE__*/ _jsxs("div", {
                                    className: "border border-gray-200 rounded-lg p-4",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "flex items-center justify-between mb-2",
                                            children: [
                                                /*#__PURE__*/ _jsxs("div", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        getStatusIcon(nodeState.status),
                                                        /*#__PURE__*/ _jsx("span", {
                                                            className: "font-medium text-gray-900",
                                                            children: nodeId
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: `px-2 py-1 rounded text-xs font-medium ${getStatusColor(nodeState.status)}`,
                                                    children: nodeState.status
                                                })
                                            ]
                                        }),
                                        nodeState.input && /*#__PURE__*/ _jsxs("div", {
                                            className: "mt-2",
                                            children: [
                                                /*#__PURE__*/ _jsx("p", {
                                                    className: "text-xs font-medium text-gray-600 mb-1",
                                                    children: "Input:"
                                                }),
                                                /*#__PURE__*/ _jsx("pre", {
                                                    className: "text-xs bg-gray-50 p-2 rounded overflow-x-auto",
                                                    children: JSON.stringify(nodeState.input, null, 2)
                                                })
                                            ]
                                        }),
                                        nodeState.output && /*#__PURE__*/ _jsxs("div", {
                                            className: "mt-3",
                                            children: [
                                                /*#__PURE__*/ _jsxs("p", {
                                                    className: "text-xs font-medium text-gray-600 mb-2 flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ _jsx("span", {
                                                            children: "Agent Response:"
                                                        }),
                                                        nodeState.status === 'completed' && /*#__PURE__*/ _jsx("span", {
                                                            className: "text-green-600",
                                                            children: "✓"
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsx("div", {
                                                    className: "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4",
                                                    children: /*#__PURE__*/ _jsx("div", {
                                                        className: "text-sm text-gray-800 whitespace-pre-wrap leading-relaxed",
                                                        children: typeof nodeState.output === 'string' ? nodeState.output : JSON.stringify(nodeState.output, null, 2)
                                                    })
                                                })
                                            ]
                                        }),
                                        nodeState.error && /*#__PURE__*/ _jsxs("div", {
                                            className: "mt-2",
                                            children: [
                                                /*#__PURE__*/ _jsx("p", {
                                                    className: "text-xs font-medium text-red-600 mb-1",
                                                    children: "Error:"
                                                }),
                                                /*#__PURE__*/ _jsx("p", {
                                                    className: "text-xs text-red-700 bg-red-50 p-2 rounded",
                                                    children: nodeState.error
                                                })
                                            ]
                                        })
                                    ]
                                }, nodeId))
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "bg-white rounded-lg shadow-md p-6 mb-6",
                    children: [
                        /*#__PURE__*/ _jsx("h3", {
                            className: "text-lg font-semibold text-gray-900 mb-4",
                            children: "Execution Logs"
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "space-y-1 font-mono text-xs",
                            children: execution.logs.map((log, index)=>/*#__PURE__*/ _jsxs("div", {
                                    className: `p-2 rounded ${log.level === 'ERROR' ? 'bg-red-50 text-red-900' : log.level === 'WARNING' ? 'bg-yellow-50 text-yellow-900' : 'bg-gray-50 text-gray-900'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "text-gray-500",
                                            children: new Date(log.timestamp).toLocaleTimeString()
                                        }),
                                        ' ',
                                        /*#__PURE__*/ _jsx("span", {
                                            className: `font-semibold ${log.level === 'ERROR' ? 'text-red-600' : log.level === 'WARNING' ? 'text-yellow-600' : 'text-blue-600'}`,
                                            children: log.level
                                        }),
                                        log.node_id && /*#__PURE__*/ _jsxs("span", {
                                            className: "text-gray-600",
                                            children: [
                                                " [",
                                                log.node_id,
                                                "]"
                                            ]
                                        }),
                                        ' ',
                                        log.message
                                    ]
                                }, index))
                        })
                    ]
                }),
                execution.result && /*#__PURE__*/ _jsxs("div", {
                    className: "bg-white rounded-lg shadow-md p-6",
                    children: [
                        /*#__PURE__*/ _jsx("h3", {
                            className: "text-lg font-semibold text-gray-900 mb-4",
                            children: "Final Result"
                        }),
                        /*#__PURE__*/ _jsx("pre", {
                            className: "text-sm bg-gray-50 p-4 rounded overflow-x-auto",
                            children: typeof execution.result === 'string' ? execution.result : JSON.stringify(execution.result, null, 2)
                        })
                    ]
                })
            ]
        })
    });
}
