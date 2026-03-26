import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Analytics Page Component
 * SOLID: Single Responsibility - only orchestrates analytics UI
 * DIP: Depends on abstractions (hooks, components) not concrete implementations
 * DRY: Uses extracted utilities and reusable components
 */ import { useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SuccessRateLine, AvgDurationLine, StatusPieLegend, ExecutionsStackedBars } from '../components/analytics/AnalyticsChartsStyled';
import { useExecutionListQuery } from '../hooks/log/useExecutionListQuery';
import { useExecutionAnalytics } from '../hooks/analytics/useExecutionAnalytics';
import { api } from '../api/client';
import { formatExecutionDuration } from '../utils/executionFormat';
import { extractApiErrorMessage } from '../hooks/utils/apiUtils';
/**
 * Analytics Page Component
 * Displays execution metrics and analytics
 */ export default function AnalyticsPage({ apiClient: injectedApiClient } = {}) {
    const { data: executions = [], isLoading: loading, error } = useExecutionListQuery({
        apiClient: injectedApiClient || api,
        refetchInterval: 10000,
        filters: {
            limit: 100
        }
    });
    const analytics = useExecutionAnalytics({
        executions,
        recentLimit: 10
    });
    const topWorkflows = useMemo(()=>{
        return Object.entries(analytics.executionsByWorkflow).sort(([, a], [, b])=>b - a).slice(0, 5).map(([workflowId, count])=>({
                workflowId,
                count
            }));
    }, [
        analytics.executionsByWorkflow
    ]);
    // Prepare chart data
    const chartData = useMemo(()=>{
        // Group executions by day
        const byDay = {};
        executions.forEach((execution)=>{
            const date = new Date(execution.started_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            if (!byDay[date]) {
                byDay[date] = {
                    date,
                    completed: 0,
                    failed: 0,
                    total: 0,
                    avgDuration: 0,
                    durations: []
                };
            }
            byDay[date].total++;
            if (execution.status === 'completed') {
                byDay[date].completed++;
            } else if (execution.status === 'failed') {
                byDay[date].failed++;
            }
            if (execution.completed_at) {
                const duration = (new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000;
                byDay[date].durations.push(duration);
            }
        });
        // Calculate average durations and success rates
        return Object.values(byDay).map((day)=>({
                ...day,
                avgDuration: day.durations.length > 0 ? Math.round(day.durations.reduce((a, b)=>a + b, 0) / day.durations.length) : 0,
                successRate: day.total > 0 ? Math.round(day.completed / day.total * 100) : 0
            })).sort((a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7) // Last 7 days
        ;
    }, [
        executions
    ]);
    // Status distribution for pie chart
    const statusChartData = useMemo(()=>{
        return Object.entries(analytics.statusCounts).map(([name, value])=>({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value
            }));
    }, [
        analytics.statusCounts
    ]);
    if (loading) {
        return /*#__PURE__*/ _jsx("div", {
            className: "h-full overflow-auto bg-gray-50 p-8",
            children: /*#__PURE__*/ _jsx("div", {
                className: "max-w-7xl mx-auto",
                children: /*#__PURE__*/ _jsx("div", {
                    className: "flex items-center justify-center h-64",
                    children: /*#__PURE__*/ _jsx("div", {
                        className: "text-gray-500",
                        children: "Loading analytics..."
                    })
                })
            })
        });
    }
    if (error) {
        return /*#__PURE__*/ _jsx("div", {
            className: "h-full overflow-auto bg-gray-50 p-8",
            children: /*#__PURE__*/ _jsx("div", {
                className: "max-w-7xl mx-auto",
                children: /*#__PURE__*/ _jsx("div", {
                    className: "flex items-center justify-center h-64",
                    children: /*#__PURE__*/ _jsxs("div", {
                        className: "text-red-500",
                        children: [
                            "Error: ",
                            extractApiErrorMessage(error, 'Unknown error')
                        ]
                    })
                })
            })
        });
    }
    return /*#__PURE__*/ _jsx("div", {
        className: "h-full overflow-auto bg-gray-50 p-8",
        children: /*#__PURE__*/ _jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "mb-6",
                    children: [
                        /*#__PURE__*/ _jsx("h1", {
                            className: "text-3xl font-bold text-gray-900 mb-2",
                            children: "Analytics"
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-gray-600",
                            children: "Execution metrics and insights"
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center justify-between mb-2",
                                    children: [
                                        /*#__PURE__*/ _jsx("h3", {
                                            className: "text-sm font-medium text-gray-600",
                                            children: "Total Executions"
                                        }),
                                        /*#__PURE__*/ _jsx(BarChart3, {
                                            className: "w-5 h-5 text-gray-400"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    className: "text-3xl font-bold text-gray-900",
                                    children: analytics.totalExecutions
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center justify-between mb-2",
                                    children: [
                                        /*#__PURE__*/ _jsx("h3", {
                                            className: "text-sm font-medium text-gray-600",
                                            children: "Success Rate"
                                        }),
                                        /*#__PURE__*/ _jsx(TrendingUp, {
                                            className: "w-5 h-5 text-green-500"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("p", {
                                    className: "text-3xl font-bold text-gray-900",
                                    children: [
                                        analytics.successRate.toFixed(1),
                                        "%"
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center justify-between mb-2",
                                    children: [
                                        /*#__PURE__*/ _jsx("h3", {
                                            className: "text-sm font-medium text-gray-600",
                                            children: "Avg Duration"
                                        }),
                                        /*#__PURE__*/ _jsx(Clock, {
                                            className: "w-5 h-5 text-blue-500"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    className: "text-3xl font-bold text-gray-900",
                                    children: analytics.averageDuration > 0 ? formatExecutionDuration(new Date(Date.now() - analytics.averageDuration * 1000).toISOString(), new Date().toISOString()) : '0s'
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center justify-between mb-2",
                                    children: [
                                        /*#__PURE__*/ _jsx("h3", {
                                            className: "text-sm font-medium text-gray-600",
                                            children: "Failed Executions"
                                        }),
                                        /*#__PURE__*/ _jsx(XCircle, {
                                            className: "w-5 h-5 text-red-500"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("p", {
                                    className: "text-3xl font-bold text-gray-900",
                                    children: analytics.statusCounts.failed || 0
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-xl font-semibold text-gray-900 mb-4",
                                    children: "Success Rate Over Time"
                                }),
                                chartData.length > 0 ? /*#__PURE__*/ _jsx(SuccessRateLine, {
                                    data: chartData
                                }) : /*#__PURE__*/ _jsx("div", {
                                    className: "flex items-center justify-center h-64 text-gray-500",
                                    children: "No data available"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-xl font-semibold text-gray-900 mb-4",
                                    children: "Average Duration Over Time"
                                }),
                                chartData.length > 0 ? /*#__PURE__*/ _jsx(AvgDurationLine, {
                                    data: chartData
                                }) : /*#__PURE__*/ _jsx("div", {
                                    className: "flex items-center justify-center h-64 text-gray-500",
                                    children: "No data available"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-xl font-semibold text-gray-900 mb-4",
                                    children: "Status Distribution"
                                }),
                                statusChartData.length > 0 ? /*#__PURE__*/ _jsx(StatusPieLegend, {
                                    data: statusChartData
                                }) : /*#__PURE__*/ _jsx("div", {
                                    className: "flex items-center justify-center h-64 text-gray-500",
                                    children: "No data available"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-xl font-semibold text-gray-900 mb-4",
                                    children: "Executions Over Time"
                                }),
                                chartData.length > 0 ? /*#__PURE__*/ _jsx(ExecutionsStackedBars, {
                                    data: chartData
                                }) : /*#__PURE__*/ _jsx("div", {
                                    className: "flex items-center justify-center h-64 text-gray-500",
                                    children: "No data available"
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-xl font-semibold text-gray-900 mb-4",
                                    children: "Status Breakdown"
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: "space-y-3",
                                    children: Object.entries(analytics.statusCounts).map(([status, count])=>{
                                        const percentage = analytics.totalExecutions > 0 ? count / analytics.totalExecutions * 100 : 0;
                                        const getStatusColor = (status)=>{
                                            switch(status){
                                                case 'completed':
                                                    return 'bg-green-500';
                                                case 'failed':
                                                    return 'bg-red-500';
                                                case 'running':
                                                    return 'bg-blue-500';
                                                case 'pending':
                                                    return 'bg-yellow-500';
                                                default:
                                                    return 'bg-gray-500';
                                            }
                                        };
                                        return /*#__PURE__*/ _jsxs("div", {
                                            children: [
                                                /*#__PURE__*/ _jsxs("div", {
                                                    className: "flex items-center justify-between mb-1",
                                                    children: [
                                                        /*#__PURE__*/ _jsx("span", {
                                                            className: "text-sm font-medium text-gray-700 capitalize",
                                                            children: status
                                                        }),
                                                        /*#__PURE__*/ _jsxs("span", {
                                                            className: "text-sm text-gray-600",
                                                            children: [
                                                                count,
                                                                " (",
                                                                percentage.toFixed(1),
                                                                "%)"
                                                            ]
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsx("div", {
                                                    className: "w-full bg-gray-200 rounded-full h-2",
                                                    children: /*#__PURE__*/ _jsx("div", {
                                                        className: `h-2 rounded-full ${getStatusColor(status)}`,
                                                        style: {
                                                            width: `${percentage}%`
                                                        }
                                                    })
                                                })
                                            ]
                                        }, status);
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                            children: [
                                /*#__PURE__*/ _jsx("h2", {
                                    className: "text-xl font-semibold text-gray-900 mb-4",
                                    children: "Top Workflows"
                                }),
                                topWorkflows.length > 0 ? /*#__PURE__*/ _jsx("div", {
                                    className: "space-y-3",
                                    children: topWorkflows.map(({ workflowId, count })=>/*#__PURE__*/ _jsxs("div", {
                                            className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                                            children: [
                                                /*#__PURE__*/ _jsxs("span", {
                                                    className: "font-mono text-sm text-gray-700",
                                                    children: [
                                                        workflowId.slice(0, 8),
                                                        "..."
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsxs("span", {
                                                    className: "text-sm font-medium text-gray-900",
                                                    children: [
                                                        count,
                                                        " executions"
                                                    ]
                                                })
                                            ]
                                        }, workflowId))
                                }) : /*#__PURE__*/ _jsx("p", {
                                    className: "text-gray-500 text-sm",
                                    children: "No workflow data available"
                                })
                            ]
                        })
                    ]
                }),
                analytics.recentExecutions.length > 0 && /*#__PURE__*/ _jsxs("div", {
                    className: "mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                    children: [
                        /*#__PURE__*/ _jsx("h2", {
                            className: "text-xl font-semibold text-gray-900 mb-4",
                            children: "Recent Executions"
                        }),
                        /*#__PURE__*/ _jsx("div", {
                            className: "space-y-2",
                            children: analytics.recentExecutions.slice(0, 5).map((execution)=>/*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                                    children: [
                                        /*#__PURE__*/ _jsxs("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                execution.status === 'completed' ? /*#__PURE__*/ _jsx(CheckCircle, {
                                                    className: "w-4 h-4 text-green-500"
                                                }) : execution.status === 'failed' ? /*#__PURE__*/ _jsx(XCircle, {
                                                    className: "w-4 h-4 text-red-500"
                                                }) : /*#__PURE__*/ _jsx(AlertCircle, {
                                                    className: "w-4 h-4 text-yellow-500"
                                                }),
                                                /*#__PURE__*/ _jsxs("span", {
                                                    className: "font-mono text-sm text-gray-700",
                                                    children: [
                                                        execution.execution_id.slice(0, 8),
                                                        "..."
                                                    ]
                                                }),
                                                /*#__PURE__*/ _jsx("span", {
                                                    className: "text-xs text-gray-500 capitalize",
                                                    children: execution.status
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ _jsx("span", {
                                            className: "text-xs text-gray-500",
                                            children: new Date(execution.started_at).toLocaleString()
                                        })
                                    ]
                                }, execution.execution_id))
                        })
                    ]
                })
            ]
        })
    });
}
