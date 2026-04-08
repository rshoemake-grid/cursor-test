import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateFilters } from "./TemplateFilters";
describe("TemplateFilters", () => {
  const mockHandlers = {
    onCategoryChange: jest.fn(),
    onSearchChange: jest.fn(),
    onSortChange: jest.fn(),
    onSearch: jest.fn(),
  };
  const mockFilters = {
    category: "",
    searchQuery: "",
    sortBy: "popular",
    activeTab: "repository",
  };
  const mockProps = {
    filters: mockFilters,
    handlers: mockHandlers,
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render all filter controls", () => {
    render(<TemplateFilters {...mockProps} />);
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /search/i,
      }),
    ).toBeInTheDocument();
  });
  it("should display current category value", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, category: "automation" }}
        handlers={mockHandlers}
      />,
    );
    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toHaveValue("automation");
  });
  it("should display current search query", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, searchQuery: "test query" }}
        handlers={mockHandlers}
      />,
    );
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveValue("test query");
  });
  it("should display current sort value", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, sortBy: "recent" }}
        handlers={mockHandlers}
      />,
    );
    const sortSelect = screen.getByLabelText(/sort/i);
    expect(sortSelect).toHaveValue("recent");
  });
  it("should call onCategoryChange when category changes", () => {
    render(<TemplateFilters {...mockProps} />);
    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, {
      target: {
        value: "data_analysis",
      },
    });
    expect(mockHandlers.onCategoryChange).toHaveBeenCalledWith("data_analysis");
  });
  it("should call onSearchChange when search input changes", () => {
    render(<TemplateFilters {...mockProps} />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, {
      target: {
        value: "new query",
      },
    });
    expect(mockHandlers.onSearchChange).toHaveBeenCalledWith("new query");
  });
  it("should call onSortChange when sort changes", () => {
    render(<TemplateFilters {...mockProps} />);
    const sortSelect = screen.getByLabelText(/sort/i);
    fireEvent.change(sortSelect, {
      target: {
        value: "rating",
      },
    });
    expect(mockHandlers.onSortChange).toHaveBeenCalledWith("rating");
  });
  it("should call onSearch when search button is clicked", () => {
    render(<TemplateFilters {...mockProps} />);
    const searchButton = screen.getByRole("button", {
      name: /search/i,
    });
    fireEvent.click(searchButton);
    expect(mockHandlers.onSearch).toHaveBeenCalled();
  });
  it("should call onSearch when Enter key is pressed in search input", () => {
    render(<TemplateFilters {...mockProps} />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.keyDown(searchInput, {
      key: "Enter",
    });
    expect(mockHandlers.onSearch).toHaveBeenCalled();
  });
  it("should show correct placeholder for agents tab", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, activeTab: "agents" }}
        handlers={mockHandlers}
      />,
    );
    expect(screen.getByPlaceholderText("Search agents...")).toBeInTheDocument();
  });
  it("should show correct placeholder for workflows-of-workflows tab", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, activeTab: "workflows-of-workflows" }}
        handlers={mockHandlers}
      />,
    );
    expect(
      screen.getByPlaceholderText("Search workflows of workflows..."),
    ).toBeInTheDocument();
  });
  it("should show correct placeholder for repository tab", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, activeTab: "repository" }}
        handlers={mockHandlers}
      />,
    );
    expect(
      screen.getByPlaceholderText("Search workflows..."),
    ).toBeInTheDocument();
  });
  it("should render all category options", () => {
    render(<TemplateFilters {...mockProps} />);
    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toBeInTheDocument();
    fireEvent.click(categorySelect);
    expect(categorySelect).toHaveValue("");
  });
  it("should render all sort options", () => {
    render(<TemplateFilters {...mockProps} />);
    const sortSelect = screen.getByLabelText(/sort/i);
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveValue("popular");
  });
  it("should handle empty search query", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, searchQuery: "" }}
        handlers={mockHandlers}
      />,
    );
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveValue("");
  });
  it("should handle category change to empty string", () => {
    render(
      <TemplateFilters
        filters={{ ...mockFilters, category: "automation" }}
        handlers={mockHandlers}
      />,
    );
    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, {
      target: {
        value: "",
      },
    });
    expect(mockHandlers.onCategoryChange).toHaveBeenCalledWith("");
  });
  it("should not call onSearch when other keys are pressed", () => {
    render(<TemplateFilters {...mockProps} />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.keyDown(searchInput, {
      key: "a",
    });
    expect(mockHandlers.onSearch).not.toHaveBeenCalled();
  });
});
