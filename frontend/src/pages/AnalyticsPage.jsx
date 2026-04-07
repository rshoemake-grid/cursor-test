import { useMemo } from "react";
import PropTypes from "prop-types";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
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
import {
  InsightsScrollShell,
  InsightsInnerWide,
  InsightsCenteredPane,
  InsightsMutedText,
  InsightsErrorText,
  InsightsPageHeader,
  InsightsPageTitle,
  InsightsPageSubtitle,
  AnalyticsStatGrid,
  AnalyticsPanelCard,
  AnalyticsStatCardHeader,
  AnalyticsStatCardLabel,
  AnalyticsStatCardValue,
  AnalyticsIconGray,
  AnalyticsIconGreen,
  AnalyticsIconBlue,
  AnalyticsIconRed,
  AnalyticsChartGrid,
  AnalyticsSectionTitle,
  AnalyticsChartEmpty,
  AnalyticsTwoColGrid,
  AnalyticsStack,
  AnalyticsStatusRow,
  AnalyticsStatusLabel,
  AnalyticsStatusMeta,
  AnalyticsProgressTrack,
  AnalyticsProgressFill,
  AnalyticsListRow,
  AnalyticsMonoId,
  AnalyticsRowMeta,
  AnalyticsRecentRowInner,
  AnalyticsRecentStatus,
  AnalyticsRecentTime,
  AnalyticsIconSmGreen,
  AnalyticsIconSmRed,
  AnalyticsIconSmYellow,
  AnalyticsRecentSection,
  AnalyticsRecentStack,
  AnalyticsEmptyHint,
} from "../styles/analyticsLogPages.styled";

function AnalyticsPage({ apiClient: injectedApiClient } = {}) {
  const {
    data: executionData,
    isLoading: loading,
    error,
  } = useExecutionListQuery({
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
        byDay[date] = {
          date,
          completed: 0,
          failed: 0,
          total: 0,
          avgDuration: 0,
          durations: [],
        };
      }
      byDay[date].total++;
      if (execution.status === "completed") {
        byDay[date].completed++;
      } else if (execution.status === "failed") {
        byDay[date].failed++;
      }
      if (execution.completed_at) {
        const duration =
          (new Date(execution.completed_at).getTime() -
            new Date(execution.started_at).getTime()) /
          1e3;
        byDay[date].durations.push(duration);
      }
    });
    return Object.values(byDay)
      .map((day) => ({
        ...day,
        avgDuration:
          day.durations.length > 0
            ? Math.round(
                day.durations.reduce((a, b) => a + b, 0) / day.durations.length,
              )
            : 0,
        successRate:
          day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0,
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
      <InsightsScrollShell>
        <InsightsInnerWide>
          <InsightsCenteredPane>
            <InsightsMutedText>Loading analytics...</InsightsMutedText>
          </InsightsCenteredPane>
        </InsightsInnerWide>
      </InsightsScrollShell>
    );
  }
  if (error) {
    return (
      <InsightsScrollShell>
        <InsightsInnerWide>
          <InsightsCenteredPane>
            <InsightsErrorText>
              Error: {extractApiErrorMessage(error, "Unknown error")}
            </InsightsErrorText>
          </InsightsCenteredPane>
        </InsightsInnerWide>
      </InsightsScrollShell>
    );
  }
  return (
    <InsightsScrollShell>
      <InsightsInnerWide>
        <InsightsPageHeader>
          <InsightsPageTitle>Analytics</InsightsPageTitle>
          <InsightsPageSubtitle>
            Execution metrics and insights
          </InsightsPageSubtitle>
        </InsightsPageHeader>
        <AnalyticsStatGrid>
          <AnalyticsPanelCard>
            <AnalyticsStatCardHeader>
              <AnalyticsStatCardLabel>
                Total Executions
              </AnalyticsStatCardLabel>
              <AnalyticsIconGray>
                <BarChart3 aria-hidden />
              </AnalyticsIconGray>
            </AnalyticsStatCardHeader>
            <AnalyticsStatCardValue>
              {analytics.totalExecutions}
            </AnalyticsStatCardValue>
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsStatCardHeader>
              <AnalyticsStatCardLabel>Success Rate</AnalyticsStatCardLabel>
              <AnalyticsIconGreen>
                <TrendingUp aria-hidden />
              </AnalyticsIconGreen>
            </AnalyticsStatCardHeader>
            <AnalyticsStatCardValue>
              {analytics.successRate.toFixed(1)}%
            </AnalyticsStatCardValue>
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsStatCardHeader>
              <AnalyticsStatCardLabel>Avg Duration</AnalyticsStatCardLabel>
              <AnalyticsIconBlue>
                <Clock aria-hidden />
              </AnalyticsIconBlue>
            </AnalyticsStatCardHeader>
            <AnalyticsStatCardValue>
              {analytics.averageDuration > 0
                ? formatExecutionDuration(
                    new Date(
                      Date.now() - analytics.averageDuration * 1e3,
                    ).toISOString(),
                    new Date().toISOString(),
                  )
                : "0s"}
            </AnalyticsStatCardValue>
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsStatCardHeader>
              <AnalyticsStatCardLabel>
                Failed Executions
              </AnalyticsStatCardLabel>
              <AnalyticsIconRed>
                <XCircle aria-hidden />
              </AnalyticsIconRed>
            </AnalyticsStatCardHeader>
            <AnalyticsStatCardValue>
              {analytics.statusCounts.failed || 0}
            </AnalyticsStatCardValue>
          </AnalyticsPanelCard>
        </AnalyticsStatGrid>
        <AnalyticsChartGrid>
          <AnalyticsPanelCard>
            <AnalyticsSectionTitle>
              Success Rate Over Time
            </AnalyticsSectionTitle>
            {chartData.length > 0 ? (
              <SuccessRateLineChart data={chartData} />
            ) : (
              <AnalyticsChartEmpty>No data available</AnalyticsChartEmpty>
            )}
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsSectionTitle>
              Average Duration Over Time
            </AnalyticsSectionTitle>
            {chartData.length > 0 ? (
              <AverageDurationLineChart data={chartData} />
            ) : (
              <AnalyticsChartEmpty>No data available</AnalyticsChartEmpty>
            )}
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsSectionTitle>Status Distribution</AnalyticsSectionTitle>
            {statusChartData.length > 0 ? (
              <StatusPieChart data={statusChartData} />
            ) : (
              <AnalyticsChartEmpty>No data available</AnalyticsChartEmpty>
            )}
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsSectionTitle>
              Executions Over Time
            </AnalyticsSectionTitle>
            {chartData.length > 0 ? (
              <ExecutionsBarChart data={chartData} />
            ) : (
              <AnalyticsChartEmpty>No data available</AnalyticsChartEmpty>
            )}
          </AnalyticsPanelCard>
        </AnalyticsChartGrid>
        <AnalyticsTwoColGrid>
          <AnalyticsPanelCard>
            <AnalyticsSectionTitle>Status Breakdown</AnalyticsSectionTitle>
            <AnalyticsStack>
              {Object.entries(analytics.statusCounts).map(([status, count]) => {
                const percentage =
                  analytics.totalExecutions > 0
                    ? (count / analytics.totalExecutions) * 100
                    : 0;
                return (
                  <div key={status}>
                    <AnalyticsStatusRow>
                      <AnalyticsStatusLabel>{status}</AnalyticsStatusLabel>
                      <AnalyticsStatusMeta>
                        {count} ({percentage.toFixed(1)}%)
                      </AnalyticsStatusMeta>
                    </AnalyticsStatusRow>
                    <AnalyticsProgressTrack>
                      <AnalyticsProgressFill
                        $status={status}
                        style={{ width: `${percentage}%` }}
                      />
                    </AnalyticsProgressTrack>
                  </div>
                );
              })}
            </AnalyticsStack>
          </AnalyticsPanelCard>
          <AnalyticsPanelCard>
            <AnalyticsSectionTitle>Top Workflows</AnalyticsSectionTitle>
            {topWorkflows.length > 0 ? (
              <AnalyticsStack>
                {topWorkflows.map(({ workflowId, count }) => (
                  <AnalyticsListRow key={workflowId}>
                    <AnalyticsMonoId>
                      {workflowId.slice(0, 8)}...
                    </AnalyticsMonoId>
                    <AnalyticsRowMeta>{count} executions</AnalyticsRowMeta>
                  </AnalyticsListRow>
                ))}
              </AnalyticsStack>
            ) : (
              <AnalyticsEmptyHint>
                No workflow data available
              </AnalyticsEmptyHint>
            )}
          </AnalyticsPanelCard>
        </AnalyticsTwoColGrid>
        {analytics.recentExecutions.length > 0 && (
          <AnalyticsRecentSection>
            <AnalyticsPanelCard>
              <AnalyticsSectionTitle>Recent Executions</AnalyticsSectionTitle>
              <AnalyticsRecentStack>
                {analytics.recentExecutions.slice(0, 5).map((execution) => (
                  <AnalyticsListRow key={execution.execution_id}>
                    <AnalyticsRecentRowInner>
                      {execution.status === "completed" ? (
                        <AnalyticsIconSmGreen>
                          <CheckCircle aria-hidden />
                        </AnalyticsIconSmGreen>
                      ) : execution.status === "failed" ? (
                        <AnalyticsIconSmRed>
                          <XCircle aria-hidden />
                        </AnalyticsIconSmRed>
                      ) : (
                        <AnalyticsIconSmYellow>
                          <AlertCircle aria-hidden />
                        </AnalyticsIconSmYellow>
                      )}
                      <AnalyticsMonoId>
                        {execution.execution_id.slice(0, 8)}...
                      </AnalyticsMonoId>
                      <AnalyticsRecentStatus>
                        {execution.status}
                      </AnalyticsRecentStatus>
                    </AnalyticsRecentRowInner>
                    <AnalyticsRecentTime>
                      {new Date(execution.started_at).toLocaleString()}
                    </AnalyticsRecentTime>
                  </AnalyticsListRow>
                ))}
              </AnalyticsRecentStack>
            </AnalyticsPanelCard>
          </AnalyticsRecentSection>
        )}
      </InsightsInnerWide>
    </InsightsScrollShell>
  );
}

AnalyticsPage.propTypes = {
  apiClient: PropTypes.shape({
    listExecutions: PropTypes.func,
  }),
};

export { AnalyticsPage as default };
