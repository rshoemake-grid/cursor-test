import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "./SearchBar";
describe("SearchBar", () => {
  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render search input", () => {
    render(/* @__PURE__ */ jsx(SearchBar, { value: "", onChange: mockOnChange }));
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });
  it("should display custom placeholder", () => {
    render(
      /* @__PURE__ */ jsx(SearchBar, { value: "", onChange: mockOnChange, placeholder: "Custom placeholder" })
    );
    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
  });
  it("should display search icon", () => {
    const { container } = render(/* @__PURE__ */ jsx(SearchBar, { value: "", onChange: mockOnChange }));
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
  it("should call onChange when input value changes", () => {
    render(/* @__PURE__ */ jsx(SearchBar, { value: "", onChange: mockOnChange }));
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "test query" } });
    expect(mockOnChange).toHaveBeenCalledWith("test query");
  });
  it("should display clear button when value is not empty", () => {
    render(/* @__PURE__ */ jsx(SearchBar, { value: "test", onChange: mockOnChange }));
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();
  });
  it("should not display clear button when value is empty", () => {
    render(/* @__PURE__ */ jsx(SearchBar, { value: "", onChange: mockOnChange }));
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });
  it("should clear input when clear button is clicked", () => {
    render(/* @__PURE__ */ jsx(SearchBar, { value: "test", onChange: mockOnChange, onClear: mockOnClear }));
    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.click(clearButton);
    expect(mockOnChange).toHaveBeenCalledWith("");
    expect(mockOnClear).toHaveBeenCalled();
  });
  it("should apply custom className", () => {
    const { container } = render(
      /* @__PURE__ */ jsx(SearchBar, { value: "", onChange: mockOnChange, className: "custom-class" })
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class");
  });
  it("should display current value", () => {
    render(/* @__PURE__ */ jsx(SearchBar, { value: "current value", onChange: mockOnChange }));
    const input = screen.getByDisplayValue("current value");
    expect(input).toBeInTheDocument();
  });
});
