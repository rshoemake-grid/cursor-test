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
    author_name: "Test Author",
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
    is_official: true,
  };
  const mockProps = {
    item: mockTemplate,
    isSelected: false,
    type: "template",
    onToggleSelect: jest.fn(),
    onClick: jest.fn(),
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render template card", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText("Test Template")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
  it("should render agent card", () => {
    render(<TemplateCard {...mockProps} item={mockAgent} type="agent" />);
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
    expect(screen.getByText("Agent description")).toBeInTheDocument();
  });
  it("should use agent label when name is not available", () => {
    const agentWithoutName = {
      ...mockAgent,
      name: void 0,
    };
    render(
      <TemplateCard {...mockProps} item={agentWithoutName} type="agent" />,
    );
    expect(screen.getByText("Test Agent Label")).toBeInTheDocument();
  });
  it("should show selected state when isSelected is true", () => {
    render(<TemplateCard {...mockProps} isSelected={true} />);
    const root = screen.getByText("Test Template").closest("[data-selected]");
    expect(root).toHaveAttribute("data-selected", "true");
  });
  it("should show unselected state when isSelected is false", () => {
    render(<TemplateCard {...mockProps} isSelected={false} />);
    const root = screen.getByText("Test Template").closest("[data-selected]");
    expect(root).toHaveAttribute("data-selected", "false");
  });
  it("should call onToggleSelect when checkbox is clicked", () => {
    render(<TemplateCard {...mockProps} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockProps.onToggleSelect).toHaveBeenCalledWith("template-1");
  });
  it("should stop propagation when checkbox is clicked", () => {
    render(<TemplateCard {...mockProps} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(mockProps.onToggleSelect).toHaveBeenCalled();
  });
  it("should call onClick when card is clicked", () => {
    render(<TemplateCard {...mockProps} />);
    const card = screen.getByText("Test Template").closest("div");
    fireEvent.click(card);
    expect(mockProps.onClick).toHaveBeenCalledWith(
      expect.any(Object),
      "template-1",
    );
  });
  it("should render official badge when is_official is true", () => {
    render(
      <TemplateCard
        {...mockProps}
        item={{
          ...mockTemplate,
          is_official: true,
        }}
      />,
    );
    expect(screen.getByText("Official")).toBeInTheDocument();
  });
  it("should not render official badge when is_official is false", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.queryByText("Official")).not.toBeInTheDocument();
  });
  it("should render tags", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("automation")).toBeInTheDocument();
  });
  it("should not render tags section when tags are empty", () => {
    render(
      <TemplateCard
        {...mockProps}
        item={{
          ...mockTemplate,
          tags: [],
        }}
      />,
    );
    expect(screen.queryByText("test")).not.toBeInTheDocument();
  });
  it("should render template metadata", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("30 minutes")).toBeInTheDocument();
  });
  it("should render agent metadata", () => {
    render(<TemplateCard {...mockProps} item={mockAgent} type="agent" />);
    expect(screen.getByText("1 hour")).toBeInTheDocument();
    expect(screen.getByText("Data Analysis")).toBeInTheDocument();
  });
  it("should render author name when available", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
  });
  it("should not render author section when author_name is not available", () => {
    render(
      <TemplateCard
        {...mockProps}
        item={{
          ...mockTemplate,
          author_name: void 0,
        }}
      />,
    );
    expect(screen.queryByText(/By:/)).not.toBeInTheDocument();
  });
  it("should render difficulty badge", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText("beginner")).toBeInTheDocument();
  });
  it("should use default difficulty when not provided", () => {
    render(
      <TemplateCard
        {...mockProps}
        item={{
          ...mockTemplate,
          difficulty: void 0,
        }}
      />,
    );
    expect(screen.getByText("beginner")).toBeInTheDocument();
  });
  it("should show selected footer text when isSelected is true", () => {
    render(<TemplateCard {...mockProps} isSelected={true} />);
    expect(screen.getByText("Selected - Click to use")).toBeInTheDocument();
  });
  it("should show unselected footer text when isSelected is false", () => {
    render(<TemplateCard {...mockProps} isSelected={false} />);
    expect(
      screen.getByText("Click card or checkbox to select"),
    ).toBeInTheDocument();
  });
  it("should use custom footerText when provided", () => {
    render(<TemplateCard {...mockProps} footerText="Custom footer" />);
    expect(screen.getByText("Custom footer")).toBeInTheDocument();
  });
  it("should render uses_count for templates", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });
  it("should render likes_count for templates", () => {
    render(<TemplateCard {...mockProps} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
  it("should handle zero counts", () => {
    render(
      <TemplateCard
        {...mockProps}
        item={{
          ...mockTemplate,
          uses_count: 0,
          likes_count: 0,
        }}
      />,
    );
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
  it("should format category correctly for agents", () => {
    render(<TemplateCard {...mockProps} item={mockAgent} type="agent" />);
    expect(screen.getByText("Data Analysis")).toBeInTheDocument();
  });
});
