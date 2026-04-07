import { render, screen, fireEvent } from "@testing-library/react";
import { MarketplaceTabButton } from "./MarketplaceTabButton";
import { Home, Settings } from "lucide-react";
describe("MarketplaceTabButton", () => {
  const mockOnClick = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render with label and icon", () => {
    render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    expect(screen.getByText("Test Tab")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
  it("should call onClick when clicked", () => {
    render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  it("should apply active styles when isActive is true", () => {
    render(
      <MarketplaceTabButton
        label="Active Tab"
        icon={Home}
        isActive={true}
        onClick={mockOnClick}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-active", "true");
  });
  it("should apply inactive styles when isActive is false", () => {
    render(
      <MarketplaceTabButton
        label="Inactive Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-active", "false");
  });
  it("should use default icon size when not provided", () => {
    render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    expect(
      screen.getByRole("button").querySelector('[data-icon-size="md"]'),
    ).toBeInTheDocument();
  });
  it("should use custom icon size when provided", () => {
    render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
        iconSize="w-4 h-4"
      />,
    );
    expect(
      screen.getByRole("button").querySelector('[data-icon-size="sm"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button").querySelector('[data-icon-size="md"]'),
    ).not.toBeInTheDocument();
  });
  it("should render different icons correctly", () => {
    const { rerender } = render(
      <MarketplaceTabButton
        label="Home Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    expect(screen.getByText("Home Tab")).toBeInTheDocument();
    rerender(
      <MarketplaceTabButton
        label="Settings Tab"
        icon={Settings}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    expect(screen.getByText("Settings Tab")).toBeInTheDocument();
  });
  it("should have correct button structure", () => {
    render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-active", "false");
    expect(button.querySelector("svg")).toBeTruthy();
  });
  it("should handle multiple clicks", () => {
    render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(3);
  });
  it("should transition between active and inactive states", () => {
    const { rerender } = render(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={false}
        onClick={mockOnClick}
      />,
    );
    let button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-active", "false");
    rerender(
      <MarketplaceTabButton
        label="Test Tab"
        icon={Home}
        isActive={true}
        onClick={mockOnClick}
      />,
    );
    button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-active", "true");
  });
});
