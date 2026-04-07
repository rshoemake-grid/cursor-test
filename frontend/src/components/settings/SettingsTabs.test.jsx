import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsTabs } from "./SettingsTabs";
import { SETTINGS_TABS } from "../../constants/settingsConstants";
describe("SettingsTabs", () => {
  const mockOnTabChange = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render both tabs", () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />,
    );
    expect(screen.getByText("LLM Providers")).toBeInTheDocument();
    expect(screen.getByText("Workflow Generation")).toBeInTheDocument();
  });
  it("should highlight active tab", () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />,
    );
    const llmTab = screen.getByText("LLM Providers").closest("button");
    const workflowTab = screen
      .getByText("Workflow Generation")
      .closest("button");
    expect(llmTab).toHaveAttribute("aria-pressed", "true");
    expect(workflowTab).toHaveAttribute("aria-pressed", "false");
  });
  it("should call onTabChange when tab is clicked", () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />,
    );
    const workflowTab = screen.getByText("Workflow Generation");
    fireEvent.click(workflowTab);
    expect(mockOnTabChange).toHaveBeenCalledWith(SETTINGS_TABS.WORKFLOW);
    expect(mockOnTabChange).toHaveBeenCalledTimes(1);
  });
  it("should switch active tab highlight when tab changes", () => {
    const { rerender } = render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />,
    );
    let llmTab = screen.getByText("LLM Providers").closest("button");
    let workflowTab = screen.getByText("Workflow Generation").closest("button");
    expect(llmTab).toHaveAttribute("aria-pressed", "true");
    expect(workflowTab).toHaveAttribute("aria-pressed", "false");
    rerender(
      <SettingsTabs
        activeTab={SETTINGS_TABS.WORKFLOW}
        onTabChange={mockOnTabChange}
      />,
    );
    llmTab = screen.getByText("LLM Providers").closest("button");
    workflowTab = screen.getByText("Workflow Generation").closest("button");
    expect(workflowTab).toHaveAttribute("aria-pressed", "true");
    expect(llmTab).toHaveAttribute("aria-pressed", "false");
  });
  it("should have correct container structure", () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />,
    );
    expect(screen.getByTestId("settings-tabs-column")).toBeInTheDocument();
  });
});
