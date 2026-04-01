import { render, screen } from "@testing-library/react";
import {
  SuccessRateLineChart,
  AverageDurationLineChart,
  StatusPieChart,
  ExecutionsBarChart,
} from "./AnalyticsCharts";

describe("AnalyticsCharts", () => {
  const chartData = [
    { date: "Jan 1", successRate: 80, avgDuration: 10, completed: 3, failed: 1, total: 4 },
  ];
  const statusData = [{ name: "Completed", value: 5 }];

  it("renders line charts with svg", () => {
    const { container } = render(<SuccessRateLineChart data={chartData} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByLabelText(/success rate over time/i)).toBeInTheDocument();
  });

  it("renders duration chart", () => {
    const { container } = render(<AverageDurationLineChart data={chartData} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders pie chart", () => {
    const { container } = render(<StatusPieChart data={statusData} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders bar chart container", () => {
    const { container } = render(<ExecutionsBarChart data={chartData} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
