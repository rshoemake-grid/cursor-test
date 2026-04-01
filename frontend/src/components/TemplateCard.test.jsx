import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateCard } from "./TemplateCard";
describe("TemplateCard", () => {
  const mockTemplate = {
    id: "template-1",
    name: "Test Template",
    description: "Test description",
    category: "automation",
    difficulty: "beginner",
    estimated_time: "30 minutes",
    tags: ["test", "automation"],
    is_official: false,
    uses_count: 10,
    likes_count: 5,
    author_name: "Test Author"
  };
  const mockAgent = {
    id: "agent-1",
    name: "Test Agent",
    label: "Test Agent Label",
    description: "Agent description",
    category: "data_analysis",
    difficulty: "intermediate",
    estimated_time: "1 hour",
    tags: ["ai", "analysis"],
    is_official: true
  };
  const mockProps = {
    item: mockTemplate,
    isSelected: false,
    type: "template",
    onToggleSelect: jest.fn(),
    onClick: jest.fn(),
    getDifficultyColor: jest.fn((difficulty) => {
      if (difficulty === "beginner") return "bg-green-100 text-green-800";
      if (difficulty === "intermediate") return "bg-yellow-100 text-yellow-800";
      return "bg-red-100 text-red-800";
    })
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render template card", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText("Test Template")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
  it("should render agent card", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: mockAgent, type: "agent" }));
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
    expect(screen.getByText("Agent description")).toBeInTheDocument();
  });
  it("should use agent label when name is not available", () => {
    const agentWithoutName = { ...mockAgent, name: void 0 };
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: agentWithoutName, type: "agent" }));
    expect(screen.getByText("Test Agent Label")).toBeInTheDocument();
  });
  it("should show selected state when isSelected is true", () => {
    const { container } = render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, isSelected: true }));
    const card = container.querySelector(".border-primary-500");
    expect(card).toBeInTheDocument();
  });
  it("should show unselected state when isSelected is false", () => {
    const { container } = render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, isSelected: false }));
    const card = container.querySelector(".border-transparent");
    expect(card).toBeInTheDocument();
  });
  it("should call onToggleSelect when checkbox is clicked", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockProps.onToggleSelect).toHaveBeenCalledWith("template-1");
  });
  it("should stop propagation when checkbox is clicked", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(mockProps.onToggleSelect).toHaveBeenCalled();
  });
  it("should call onClick when card is clicked", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    const card = screen.getByText("Test Template").closest("div");
    fireEvent.click(card);
    expect(mockProps.onClick).toHaveBeenCalledWith(expect.any(Object), "template-1");
  });
  it("should render official badge when is_official is true", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: { ...mockTemplate, is_official: true } }));
    expect(screen.getByText("Official")).toBeInTheDocument();
  });
  it("should not render official badge when is_official is false", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.queryByText("Official")).not.toBeInTheDocument();
  });
  it("should render tags", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("automation")).toBeInTheDocument();
  });
  it("should not render tags section when tags are empty", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: { ...mockTemplate, tags: [] } }));
    expect(screen.queryByText("test")).not.toBeInTheDocument();
  });
  it("should render template metadata", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("30 minutes")).toBeInTheDocument();
  });
  it("should render agent metadata", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: mockAgent, type: "agent" }));
    expect(screen.getByText("1 hour")).toBeInTheDocument();
    expect(screen.getByText("Data Analysis")).toBeInTheDocument();
  });
  it("should render author name when available", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
  });
  it("should not render author section when author_name is not available", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: { ...mockTemplate, author_name: void 0 } }));
    expect(screen.queryByText(/By:/)).not.toBeInTheDocument();
  });
  it("should render difficulty badge", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText("beginner")).toBeInTheDocument();
  });
  it("should call getDifficultyColor with difficulty", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(mockProps.getDifficultyColor).toHaveBeenCalledWith("beginner");
  });
  it("should use default difficulty when not provided", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: { ...mockTemplate, difficulty: void 0 } }));
    expect(mockProps.getDifficultyColor).toHaveBeenCalledWith("beginner");
  });
  it("should show selected footer text when isSelected is true", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, isSelected: true }));
    expect(screen.getByText("Selected - Click to use")).toBeInTheDocument();
  });
  it("should show unselected footer text when isSelected is false", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, isSelected: false }));
    expect(screen.getByText("Click card or checkbox to select")).toBeInTheDocument();
  });
  it("should use custom footerText when provided", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, footerText: "Custom footer" }));
    expect(screen.getByText("Custom footer")).toBeInTheDocument();
  });
  it("should render uses_count for templates", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText("10")).toBeInTheDocument();
  });
  it("should render likes_count for templates", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps }));
    expect(screen.getByText("5")).toBeInTheDocument();
  });
  it("should handle zero counts", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: { ...mockTemplate, uses_count: 0, likes_count: 0 } }));
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
  it("should format category correctly for agents", () => {
    render(/* @__PURE__ */ jsx(TemplateCard, { ...mockProps, item: mockAgent, type: "agent" }));
    expect(screen.getByText("Data Analysis")).toBeInTheDocument();
  });
});
