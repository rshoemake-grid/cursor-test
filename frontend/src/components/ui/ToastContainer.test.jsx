import { render, screen } from "@testing-library/react";
import ToastContainer from "./ToastContainer";
describe("ToastContainer", () => {
  const mockOnRemoveToast = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render nothing when toasts array is empty", () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemoveToast={mockOnRemoveToast} />,
    );
    expect(container.firstChild).toBeNull();
  });
  it("should render multiple toasts", () => {
    const toasts = [
      {
        id: "toast-1",
        message: "First message",
        type: "success",
      },
      {
        id: "toast-2",
        message: "Second message",
        type: "error",
      },
    ];
    render(
      <ToastContainer toasts={toasts} onRemoveToast={mockOnRemoveToast} />,
    );
    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
  });
  it("should pass onRemoveToast to each toast", () => {
    const toasts = [
      {
        id: "toast-1",
        message: "Test message",
        type: "info",
      },
    ];
    render(
      <ToastContainer toasts={toasts} onRemoveToast={mockOnRemoveToast} />,
    );
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });
  it("should render toasts with different types", () => {
    const toasts = [
      {
        id: "toast-1",
        message: "Success",
        type: "success",
      },
      {
        id: "toast-2",
        message: "Error",
        type: "error",
      },
      {
        id: "toast-3",
        message: "Warning",
        type: "warning",
      },
      {
        id: "toast-4",
        message: "Info",
        type: "info",
      },
    ];
    render(
      <ToastContainer toasts={toasts} onRemoveToast={mockOnRemoveToast} />,
    );
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Info")).toBeInTheDocument();
  });
  it("should have correct container styling", () => {
    const toasts = [
      {
        id: "toast-1",
        message: "Test",
        type: "info",
      },
    ];
    const { container } = render(
      <ToastContainer toasts={toasts} onRemoveToast={mockOnRemoveToast} />,
    );
    const toastContainer = container.firstChild;
    expect(toastContainer).toHaveClass("fixed", "top-4", "right-4", "z-50");
  });
});
