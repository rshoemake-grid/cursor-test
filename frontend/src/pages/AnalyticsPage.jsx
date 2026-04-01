import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useExecutionListQuery } from "../hooks/log/useExecutionListQuery";
import { useExecutionAnalytics } from "../hooks/analytics/useExecutionAnalytics";
import { api } from "../api/client";
import { formatExecutionDuration } from "../utils/executionFormat";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
function AnalyticsPage({
  apiClient: injectedApiClient
} = {}) {
  const { data: executions = [], isLoading: loading, error } = useExecutionListQuery({
    apiClient: injectedApiClient || api,
    refetchInterval: 1e4,
    // Poll less frequently for analytics
    filters: { limit: 100 }
    // Maximum allowed by API (le=100)
  });
  const analytics = useExecutionAnalytics({
    executions,
    recentLimit: 10
  });
  const topWorkflows = useMemo(() => {
    return Object.entries(analytics.executionsByWorkflow).sort(([, a], [, b]) => b - a).slice(0, 5).map(([workflowId, count]) => ({
      workflowId,
      count
    }));
  }, [analytics.executionsByWorkflow]);
  const chartData = useMemo(() => {
    const byDay = {};
    executions.forEach((execution) => {
      const date = new Date(execution.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!byDay[date]) {
        byDay[date] = { date, completed: 0, failed: 0, total: 0, avgDuration: 0, durations: [] };
      }
      byDay[date].total++;
      if (execution.status === "completed") {
        byDay[date].completed++;
      } else if (execution.status === "failed") {
        byDay[date].failed++;
      }
      if (execution.completed_at) {
        const duration = (new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1e3;
        byDay[date].durations.push(duration);
      }
    });
    return Object.values(byDay).map((day) => ({
      ...day,
      avgDuration: day.durations.length > 0 ? Math.round(day.durations.reduce((a, b) => a + b, 0) / day.durations.length) : 0,
      successRate: day.total > 0 ? Math.round(day.completed / day.total * 100) : 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [executions]);
  const statusChartData = useMemo(() => {
    return Object.entries(analytics.statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [analytics.statusCounts]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading analytics..." }) }) }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxs("div", { className: "text-red-500", children: [
      "Error: ",
      extractApiErrorMessage(error, "Unknown error")
    ] }) }) }) });
  }
  const COLORS = {
    completed: "#10b981",
    failed: "#ef4444",
    running: "#3b82f6",
    pending: "#f59e0b",
    cancelled: "#6b7280"
  };
  return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-gray-50 p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Analytics" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Execution metrics and insights" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Total Executions" }),
          /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5 text-gray-400" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-gray-900", children: analytics.totalExecutions })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Success Rate" }),
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-green-500" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold text-gray-900", children: [
          analytics.successRate.toFixed(1),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Avg Duration" }),
          /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-blue-500" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-gray-900", children: analytics.averageDuration > 0 ? formatExecutionDuration(
          new Date(Date.now() - analytics.averageDuration * 1e3).toISOString(),
          (/* @__PURE__ */ new Date()).toISOString()
        ) : "0s" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-600", children: "Failed Executions" }),
          /* @__PURE__ */ jsx(XCircle, { className: "w-5 h-5 text-red-500" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-gray-900", children: analytics.statusCounts.failed || 0 })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Success Rate Over Time" }),
        chartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(LineChart, { data: chartData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date" }),
          /* @__PURE__ */ jsx(YAxis, { domain: [0, 100] }),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => `${value ?? 0}%` }),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "successRate",
              stroke: "#10b981",
              strokeWidth: 2,
              name: "Success Rate (%)"
            }
          )
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64 text-gray-500", children: "No data available" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Average Duration Over Time" }),
        chartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(LineChart, { data: chartData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date" }),
          /* @__PURE__ */ jsx(YAxis, {}),
          /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => `${value ?? 0}s` }),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "avgDuration",
              stroke: "#3b82f6",
              strokeWidth: 2,
              name: "Avg Duration (s)"
            }
          )
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64 text-gray-500", children: "No data available" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Status Distribution" }),
        statusChartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: statusChartData,
              cx: "50%",
              cy: "50%",
              labelLine: false,
              label: ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`,
              outerRadius: 80,
              fill: "#8884d8",
              dataKey: "value",
              children: statusChartData.map((entry, index) => /* @__PURE__ */ jsx(
                Cell,
                {
                  fill: COLORS[entry.name.toLowerCase()] || "#8884d8"
                },
                `cell-${index}`
              ))
            }
          ),
          /* @__PURE__ */ jsx(Tooltip, {})
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64 text-gray-500", children: "No data available" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Executions Over Time" }),
        chartData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 250, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date" }),
          /* @__PURE__ */ jsx(YAxis, {}),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "completed", stackId: "a", fill: "#10b981", name: "Completed" }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "failed", stackId: "a", fill: "#ef4444", name: "Failed" }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "total", fill: "#3b82f6", name: "Total" })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64 text-gray-500", children: "No data available" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Status Breakdown" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Object.entries(analytics.statusCounts).map(([status, count]) => {
          const percentage = analytics.totalExecutions > 0 ? count / analytics.totalExecutions * 100 : 0;
          const getStatusColor = (status2) => {
            switch (status2) {
              case "completed":
                return "bg-green-500";
              case "failed":
                return "bg-red-500";
              case "running":
                return "bg-blue-500";
              case "pending":
                return "bg-yellow-500";
              default:
                return "bg-gray-500";
            }
          };
          return /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700 capitalize", children: status }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-600", children: [
                count,
                " (",
                percentage.toFixed(1),
                "%)"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: `h-2 rounded-full ${getStatusColor(status)}`,
                style: { width: `${percentage}%` }
              }
            ) })
          ] }, status);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Top Workflows" }),
        topWorkflows.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: topWorkflows.map(({ workflowId, count }) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
            children: [
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-sm text-gray-700", children: [
                workflowId.slice(0, 8),
                "..."
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium text-gray-900", children: [
                count,
                " executions"
              ] })
            ]
          },
          workflowId
        )) }) : /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "No workflow data available" })
      ] })
    ] }),
    analytics.recentExecutions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-4", children: "Recent Executions" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: analytics.recentExecutions.slice(0, 5).map((execution) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              execution.status === "completed" ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }) : execution.status === "failed" ? /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 text-red-500" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 text-yellow-500" }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-sm text-gray-700", children: [
                execution.execution_id.slice(0, 8),
                "..."
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 capitalize", children: execution.status })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: new Date(execution.started_at).toLocaleString() })
          ]
        },
        execution.execution_id
      )) })
    ] })
  ] }) });
}
export {
  AnalyticsPage as default
};
