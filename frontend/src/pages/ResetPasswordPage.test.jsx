import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import ResetPasswordPage from "./ResetPasswordPage";
import { API_CONFIG } from "../config/constants";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, {
    timeout,
  });
};
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));
global.fetch = jest.fn();
const mockUseNavigate = useNavigate;
const mockUseSearchParams = useSearchParams;
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};
describe("ResetPasswordPage", () => {
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams("?token=test-token"),
      jest.fn(),
    ]);
  });
  it("should render reset password page", async () => {
    renderWithRouter(<ResetPasswordPage />);
    await waitForWithTimeout(() => {
      expect(
        screen.getByRole("heading", {
          name: /Reset Password/,
        }),
      ).toBeInTheDocument();
    });
  });
  it("should show error when token is missing", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(""), jest.fn()]);
    renderWithRouter(<ResetPasswordPage />);
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Reset token is missing/)).toBeInTheDocument();
    });
  });
  it("should show error when token is missing on submit", async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(""), jest.fn()]);
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const submitButton = screen.getByRole("button", {
      name: /Reset Password/,
    });
    fireEvent.change(passwordInputs[0], {
      target: {
        value: "newpassword123",
      },
    });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "newpassword123",
        },
      });
    }
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Reset token is missing/)).toBeInTheDocument();
    });
  });
  it("should handle password reset", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const submitButton = screen.getByRole("button", {
      name: /Reset Password/,
    });
    fireEvent.change(passwordInputs[0], {
      target: {
        value: "newpassword123",
      },
    });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "newpassword123",
        },
      });
    }
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD}`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: "test-token",
            new_password: "newpassword123",
          }),
        }),
      );
    });
  });
  it("should show error when passwords do not match", async () => {
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const submitButton = screen.getByRole("button", {
      name: /Reset Password/,
    });
    fireEvent.change(passwordInputs[0], {
      target: {
        value: "password123",
      },
    });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "different",
        },
      });
    }
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });
  it("should show error when password is too short", async () => {
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const submitButton = screen.getByRole("button", {
      name: /Reset Password/,
    });
    fireEvent.change(passwordInputs[0], {
      target: {
        value: "12345",
      },
    });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "12345",
        },
      });
    }
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(
        screen.getByText(/Password must be at least 6 characters/),
      ).toBeInTheDocument();
    });
  });
  it("should toggle password visibility", async () => {
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const passwordInput = passwordInputs[0];
    expect(passwordInput.type).toBe("password");
    const showPasswordButtons = screen.getAllByRole("button", {
      name: /Show password/i,
    });
    fireEvent.click(showPasswordButtons[0]);
    expect(passwordInput.type).toBe("text");
  });
  it("should show success message after successful reset", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const submitButton = screen.getByRole("button", {
      name: /Reset Password/,
    });
    fireEvent.change(passwordInputs[0], {
      target: {
        value: "newpassword123",
      },
    });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "newpassword123",
        },
      });
    }
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(
        screen.getByText("Password Reset Successful!"),
      ).toBeInTheDocument();
    }, 3e3);
  });
  it("should handle API error", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: "Invalid token",
      }),
    });
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const submitButton = screen.getByRole("button", {
      name: /Reset Password/,
    });
    fireEvent.change(passwordInputs[0], {
      target: {
        value: "newpassword123",
      },
    });
    if (passwordInputs.length > 1) {
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "newpassword123",
        },
      });
    }
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Invalid token")).toBeInTheDocument();
    });
  });
  it("should submit form when Enter key is pressed and token exists", async () => {
    const mockHttpClient = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
      put: jest.fn(),
      delete: jest.fn(),
    };
    renderWithRouter(<ResetPasswordPage httpClient={mockHttpClient} />);
    await waitForWithTimeout(() => {
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
      fireEvent.change(passwordInputs[0], {
        target: {
          value: "newpassword123",
        },
      });
      fireEvent.change(passwordInputs[1], {
        target: {
          value: "newpassword123",
        },
      });
      fireEvent.keyDown(passwordInputs[1], {
        key: "Enter",
        code: "Enter",
      });
    });
    await waitForWithTimeout(() => {
      expect(mockHttpClient.post).toHaveBeenCalled();
    }, 3e3);
  });
  it("should toggle confirm password visibility", async () => {
    renderWithRouter(<ResetPasswordPage />);
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
    const confirmPasswordInput =
      passwordInputs.length > 1 ? passwordInputs[1] : passwordInputs[0];
    expect(confirmPasswordInput.type).toBe("password");
    const showPasswordButtons = screen.getAllByRole("button", {
      name: /Show password/i,
    });
    expect(showPasswordButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(showPasswordButtons[1]);
    expect(confirmPasswordInput.type).toBe("text");
  });
  describe("Dependency Injection", () => {
    it("should use injected HTTP client", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      renderWithRouter(<ResetPasswordPage httpClient={mockHttpClient} />);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole("button", {
        name: /Reset Password/,
      });
      fireEvent.change(passwordInputs[0], {
        target: {
          value: "newpassword123",
        },
      });
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], {
          target: {
            value: "newpassword123",
          },
        });
      }
      fireEvent.click(submitButton);
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          expect.stringContaining("/auth/reset-password"),
          expect.objectContaining({
            token: "test-token",
            new_password: "newpassword123",
          }),
          expect.any(Object),
        );
      });
    });
    it("should use injected API base URL", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({}),
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      renderWithRouter(
        <ResetPasswordPage
          httpClient={mockHttpClient}
          apiBaseUrl="https://custom-api.example.com/api"
        />,
      );
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole("button", {
        name: /Reset Password/,
      });
      fireEvent.change(passwordInputs[0], {
        target: {
          value: "newpassword123",
        },
      });
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], {
          target: {
            value: "newpassword123",
          },
        });
      }
      fireEvent.click(submitButton);
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          "https://custom-api.example.com/api/auth/reset-password",
          expect.any(Object),
          expect.any(Object),
        );
      });
    });
    it("should handle HTTP client errors gracefully", async () => {
      const mockHttpClient = {
        get: jest.fn(),
        post: jest.fn().mockRejectedValue(new Error("Network error")),
        put: jest.fn(),
        delete: jest.fn(),
      };
      renderWithRouter(<ResetPasswordPage httpClient={mockHttpClient} />);
      const passwordInputs = screen.getAllByPlaceholderText(/••••••••/);
      const submitButton = screen.getByRole("button", {
        name: /Reset Password/,
      });
      fireEvent.change(passwordInputs[0], {
        target: {
          value: "newpassword123",
        },
      });
      if (passwordInputs.length > 1) {
        fireEvent.change(passwordInputs[1], {
          target: {
            value: "newpassword123",
          },
        });
      }
      fireEvent.click(submitButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });
});
