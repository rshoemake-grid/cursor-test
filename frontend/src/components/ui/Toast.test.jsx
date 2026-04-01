import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Toast from "./Toast";
describe("Toast", () => {
  const mockOnClose = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  it("should render toast with message", () => {
    render(/* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Test message", onClose: mockOnClose }));
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });
  it("should render success toast", () => {
    render(
      /* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Success message", type: "success", onClose: mockOnClose })
    );
    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("bg-green-50");
  });
  it("should render error toast", () => {
    render(/* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Error message", type: "error", onClose: mockOnClose }));
    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("bg-red-50");
  });
  it("should render warning toast", () => {
    render(
      /* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Warning message", type: "warning", onClose: mockOnClose })
    );
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("bg-yellow-50");
  });
  it("should render info toast", () => {
    render(/* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Info message", type: "info", onClose: mockOnClose }));
    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("bg-blue-50");
  });
  it("should call onClose when close button is clicked", () => {
    render(/* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Test message", onClose: mockOnClose }));
    const closeButton = screen.getByLabelText("Close notification");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledWith("toast-1");
  });
  it("should auto-close after duration", async () => {
    render(
      /* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Test message", duration: 1e3, onClose: mockOnClose })
    );
    expect(mockOnClose).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1e3);
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith("toast-1");
    });
  });
  it("should not auto-close when duration is 0", () => {
    render(/* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Test message", duration: 0, onClose: mockOnClose }));
    jest.advanceTimersByTime(1e4);
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  it("should have correct aria role", () => {
    render(/* @__PURE__ */ jsx(Toast, { id: "toast-1", message: "Test message", onClose: mockOnClose }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
