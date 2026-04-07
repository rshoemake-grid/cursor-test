import { render, screen } from "@testing-library/react";
import {
  InsightsScrollShell,
  InsightsPageTitle,
  LogToolbarButton,
  AnalyticsPanelCard,
} from "./analyticsLogPages.styled";

describe("analyticsLogPages.styled", () => {
  it("renders InsightsScrollShell with child", () => {
    render(
      <InsightsScrollShell data-testid="shell">
        <span>content</span>
      </InsightsScrollShell>,
    );
    expect(screen.getByTestId("shell")).toContainHTML("content");
  });

  it("renders InsightsPageTitle as heading", () => {
    render(<InsightsPageTitle>Execution Log</InsightsPageTitle>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Execution Log",
    );
  });

  it("renders LogToolbarButton primary variant", () => {
    render(
      <LogToolbarButton type="button" $variant="primary">
        Action
      </LogToolbarButton>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("Action");
  });

  it("renders AnalyticsPanelCard", () => {
    render(
      <AnalyticsPanelCard data-testid="card">
        <span>panel</span>
      </AnalyticsPanelCard>,
    );
    expect(screen.getByTestId("card")).toContainHTML("panel");
  });
});
