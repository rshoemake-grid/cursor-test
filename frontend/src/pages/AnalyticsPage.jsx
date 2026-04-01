import { useMemo } from "react";
import PropTypes from "prop-types";
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useExecutionListQuery } from "../hooks/log/useExecutionListQuery";
import { useExecutionAnalytics } from "../hooks/analytics/useExecutionAnalytics";
import { api } from "../api/client";
import { formatExecutionDuration } from "../utils/executionFormat";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import {
  SuccessRateLineChart,
  AverageDurationLineChart,
  StatusPieChart,
  ExecutionsBarChart,
} from "./AnalyticsCharts";

function AnalyticsPage({ apiClient: injectedApiClient } = {}) {
  const { data: executionData, isLoading: loading, error } = useExecutionListQuery({
    apiClient: injectedApiClient || api,
    refetchInterval: 1e4,
    filters: { limit: 100 },
  });
  const executions = executionData ?? [];
  const analytics = useExecutionAnalytics({
    executions,
    recentLimit: 10,
  });
  const topWorkflows = useMemo(() => {
    return Object.entries(analytics.executionsByWorkflow)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([workflowId, count]) => ({
        workflowId,
        count,
      }));
  }, [analytics.executionsByWorkflow]);
  const chartData = useMemo(() => {
    const byDay = {};
    executions.forEach((execution) => {
      const date = new Date(execution.started_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
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
        const duration =
          (new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1e3;
        byDay[date].durations.push(duration);
      }
    });
    return Object.values(byDay)
      .map((day) => ({
        ...day,
        avgDuration:
          day.durations.length > 0
            ? Math.round(day.durations.reduce((a, b) => a + b, 0) / day.durations.length)
            : 0,
        successRate: day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);
  }, [executions]);
  const statusChartData = useMemo(() => {
    return Object.entries(analytics.statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [analytics.statusCounts]);
  if (loading) {
    return (
      <div className="h-full overflow-auto bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-full overflow-auto bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">
              Error: {extractApiErrorMessage(error, "Unknown error")}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Execution metrics and insights</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Executions</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalExecutions}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.successRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Duration</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.averageDuration > 0
                ? formatExecutionDuration(
                    new Date(Date.now() - analytics.averageDuration * 1e3).toISOString(),
                    new Date().toISOString(),
                  )
                : "0s"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Failed Executions</h3>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.statusCounts.failed || 0}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Success Rate Over Time</h2>
            {chartData.length > 0 ? (
              <SuccessRateLineChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Average Duration Over Time</h2>
            {chartData.length > 0 ? (
              <AverageDurationLineChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Distribution</h2>
            {statusChartData.length > 0 ? (
              <StatusPieChart data={statusChartData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Executions Over Time</h2>
            {chartData.length > 0 ? (
              <ExecutionsBarChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">No data available</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(analytics.statusCounts).map(([status, count]) => {
                const percentage =
                  analytics.totalExecutions > 0 ? (count / analytics.totalExecutions) * 100 : 0;
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
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Workflows</h2>
            {topWorkflows.length > 0 ? (
              <div className="space-y-3">
                {topWorkflows.map(({ workflowId, count }) => (
                  <div
                    key={workflowId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-mono text-sm text-gray-700">{workflowId.slice(0, 8)}...</span>
                    <span className="text-sm font-medium text-gray-900">{count} executions</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No workflow data available</p>
            )}
          </div>
        </div>
        {analytics.recentExecutions.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Executions</h2>
            <div className="space-y-2">
              {analytics.recentExecutions.slice(0, 5).map((execution) => (
                <div
                  key={execution.execution_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {execution.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : execution.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-mono text-sm text-gray-700">
                      {execution.execution_id.slice(0, 8)}...
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{execution.status}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(execution.started_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

AnalyticsPage.propTypes = {
  apiClient: PropTypes.shape({
    listExecutions: PropTypes.func,
  }),
};

export { AnalyticsPage as default };
