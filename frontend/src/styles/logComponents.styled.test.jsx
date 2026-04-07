import { render, screen } from "@testing-library/react";
import {
  LogBulkBar,
  LogListItemRoot,
  LogAdvPanelRoot,
  LogAdvPanelTitle,
} from "./logComponents.styled";

describe("logComponents.styled", () => {
  it("renders LogBulkBar", () => {
    render(
      <LogBulkBar data-testid="bulk">
        <span>content</span>
      </LogBulkBar>,
    );
    expect(screen.getByTestId("bulk")).toHaveTextContent("content");
  });

  it("renders LogListItemRoot with execution list test id and state attrs", () => {
    render(
      <LogListItemRoot $selected={true} $isActive={false}>
        row
      </LogListItemRoot>,
    );
    const row = screen.getByTestId("execution-list-item");
    expect(row).toHaveTextContent("row");
    expect(row).toHaveAttribute("data-selected", "true");
    expect(row).toHaveAttribute("data-active", "false");
  });

  it("renders LogAdvPanelRoot with title", () => {
    render(
      <LogAdvPanelRoot data-testid="adv-panel">
        <LogAdvPanelTitle>Advanced Filters</LogAdvPanelTitle>
      </LogAdvPanelRoot>,
    );
    expect(screen.getByTestId("adv-panel")).toHaveTextContent("Advanced Filters");
  });
});
