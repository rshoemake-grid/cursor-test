import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn()
}));
global.fetch = jest.fn();
const mockUseNavigate = useNavigate;
const renderWithRouter = (component) => {
  return render(/* @__PURE__ */ jsx(BrowserRouter, { children: component }));
};
describe("ForgotPasswordPage", () => {
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });
  it("should render forgot password page", async () => {
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
    }, 2e3);
  });
  it("should handle email submission", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "reset-token-123" })
    });
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);
    }, 2e3);
    await waitForWithTimeout(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/forgot-password",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" })
        })
      );
    }, 3e3);
  });
  it("should show success message after submission", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "reset-token-123" })
    });
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(screen.getByText("Check Your Email")).toBeInTheDocument();
    }, 3e3);
  });
  it("should show reset token in development mode", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "reset-token-123" })
    });
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(screen.getByText("reset-token-123")).toBeInTheDocument();
    }, 3e3);
    process.env.NODE_ENV = originalEnv;
  });
  it("should handle API error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Email not found" })
    });
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(screen.getByText("Email not found")).toBeInTheDocument();
    });
  });
  it("should navigate back to auth page", async () => {
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      const backButton = screen.getByText(/Back to Login/);
      fireEvent.click(backButton);
    });
    expect(mockNavigate).toHaveBeenCalledWith("/auth");
  });
  it("should submit form when Enter key is pressed", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "reset-token-123" })
    });
    renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, {}));
    await waitForWithTimeout(() => {
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.keyDown(emailInput, { key: "Enter", code: "Enter" });
    });
    await waitForWithTimeout(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, 3e3);
  });
  describe("Dependency Injection", () => {
    it("should use injected HTTP client", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ token: "reset-token-123" })
        }),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const emailInput = screen.getByPlaceholderText(/your@email.com/);
        const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.click(submitButton);
      });
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining("/auth/forgot-password"),
          { email: "test@example.com" },
          expect.any(Object)
        );
      });
    });
    it("should use injected API base URL", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ token: "reset-token-123" })
        }),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(
        /* @__PURE__ */ jsx(
          ForgotPasswordPage,
          {
            httpClient: mockHttpClient,
            apiBaseUrl: "https://custom-api.example.com/api"
          }
        )
      );
      await waitForWithTimeout(() => {
        const emailInput = screen.getByPlaceholderText(/your@email.com/);
        const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.click(submitButton);
      });
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          "https://custom-api.example.com/api/auth/forgot-password",
          expect.any(Object),
          expect.any(Object)
        );
      });
    });
    it("should handle HTTP client errors gracefully", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockRejectedValue(new Error("Network error")),
        put: jest.fn(),
        delete: jest.fn()
      };
      renderWithRouter(/* @__PURE__ */ jsx(ForgotPasswordPage, { httpClient: mockHttpClient }));
      await waitForWithTimeout(() => {
        const emailInput = screen.getByPlaceholderText(/your@email.com/);
        const submitButton = screen.getByRole("button", { name: /Send Reset Link/ });
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.click(submitButton);
      });
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });
});
