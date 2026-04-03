import { render, screen, fireEvent, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, {
    timeout,
  });
};
import { BrowserRouter } from "react-router-dom";
import AuthPage from "./AuthPage";
import { useAuth } from "../contexts/AuthContext";
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));
const mockUseAuth = useAuth;
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};
describe("AuthPage", () => {
  const mockLogin = jest.fn();
  const mockRegister = jest.fn();
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: mockLogin,
      logout: jest.fn(),
      register: mockRegister,
    });
    jest
      .spyOn(require("react-router-dom"), "useNavigate")
      .mockReturnValue(mockNavigate);
  });
  it("should render login form by default", () => {
    renderWithRouter(<AuthPage />);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your username"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      ),
    ).toBeInTheDocument();
  });
  it("should switch to register form", () => {
    renderWithRouter(<AuthPage />);
    const switchButton = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchButton);
    const createAccountElements = screen.getAllByText("Create Account");
    expect(createAccountElements.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/your@email.com/)).toBeInTheDocument();
  });
  it("should handle login", async () => {
    mockLogin.mockResolvedValue(void 0);
    renderWithRouter(<AuthPage />);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    const submitButton = screen.getByRole("button", {
      name: /Sign In/,
    });
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", "password123", false);
    });
  });
  it("should handle register", async () => {
    mockRegister.mockResolvedValue(void 0);
    renderWithRouter(<AuthPage />);
    const switchButton = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchButton);
    await waitForWithTimeout(() => {
      const usernameInput = screen.getByPlaceholderText("Enter your username");
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const passwordInput = screen.getByPlaceholderText(
        "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      );
      const submitButton = screen.getByRole("button", {
        name: /Create Account/,
      });
      fireEvent.change(usernameInput, {
        target: {
          value: "newuser",
        },
      });
      fireEvent.change(emailInput, {
        target: {
          value: "new@example.com",
        },
      });
      fireEvent.change(passwordInput, {
        target: {
          value: "password123",
        },
      });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
  });
  it("should toggle password visibility", () => {
    renderWithRouter(<AuthPage />);
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    expect(passwordInput.type).toBe("password");
    const eyeIcon = passwordInput.parentElement?.querySelector("button");
    if (eyeIcon) {
      fireEvent.click(eyeIcon);
      expect(passwordInput.type).toBe("text");
    }
  });
  it("should handle remember me checkbox", () => {
    renderWithRouter(<AuthPage />);
    const rememberMeCheckbox = screen.getByLabelText(/Keep me logged in/);
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox.checked).toBe(true);
  });
  it("should display error message on login failure", async () => {
    const error = new Error("Invalid credentials");
    mockLogin.mockRejectedValue(error);
    renderWithRouter(<AuthPage />);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    const submitButton = screen.getByRole("button", {
      name: /Sign In/,
    });
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "wrongpassword",
      },
    });
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
  it("should show loading state during login", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<AuthPage />);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    const form = usernameInput.closest("form");
    if (form) {
      fireEvent.change(usernameInput, {
        target: {
          value: "testuser",
        },
      });
      fireEvent.change(passwordInput, {
        target: {
          value: "password",
        },
      });
      fireEvent.submit(form);
      await waitForWithTimeout(() => {
        const submitButton = screen.getByRole("button", {
          name: /Processing/,
        });
        expect(submitButton).toBeDisabled();
      });
    }
  });
  it("should handle remember me checkbox", async () => {
    mockLogin.mockResolvedValue(void 0);
    renderWithRouter(<AuthPage />);
    const rememberMeCheckbox = screen.getByRole("checkbox", {
      name: /Keep me logged in/i,
    });
    fireEvent.click(rememberMeCheckbox);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    const submitButton = screen.getByRole("button", {
      name: /Sign In/,
    });
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", "password123", true);
    });
  });
  it("should toggle password visibility", () => {
    renderWithRouter(<AuthPage />);
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    expect(passwordInput.type).toBe("password");
    const toggleButton =
      passwordInput.nextElementSibling?.querySelector("button");
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("text");
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("password");
    }
  });
  it("should handle register with fullName", async () => {
    mockRegister.mockResolvedValue(void 0);
    renderWithRouter(<AuthPage />);
    const switchButton = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchButton);
    await waitForWithTimeout(() => {
      const usernameInput = screen.getByPlaceholderText("Enter your username");
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const passwordInput = screen.getByPlaceholderText(
        "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      );
      const fullNameInput = screen.getByPlaceholderText("John Doe");
      const submitButton = screen.getByRole("button", {
        name: /Create Account/,
      });
      fireEvent.change(usernameInput, {
        target: {
          value: "newuser",
        },
      });
      fireEvent.change(emailInput, {
        target: {
          value: "new@example.com",
        },
      });
      fireEvent.change(passwordInput, {
        target: {
          value: "password123",
        },
      });
      fireEvent.change(fullNameInput, {
        target: {
          value: "John Doe",
        },
      });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "newuser",
        "new@example.com",
        "password123",
        "John Doe",
      );
    });
  });
  it("should handle register without fullName", async () => {
    mockRegister.mockResolvedValue(void 0);
    renderWithRouter(<AuthPage />);
    const switchButton = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchButton);
    await waitForWithTimeout(() => {
      const usernameInput = screen.getByPlaceholderText("Enter your username");
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const passwordInput = screen.getByPlaceholderText(
        "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      );
      const submitButton = screen.getByRole("button", {
        name: /Create Account/,
      });
      fireEvent.change(usernameInput, {
        target: {
          value: "newuser",
        },
      });
      fireEvent.change(emailInput, {
        target: {
          value: "new@example.com",
        },
      });
      fireEvent.change(passwordInput, {
        target: {
          value: "password123",
        },
      });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        "newuser",
        "new@example.com",
        "password123",
        "",
      );
    });
  });
  it("should display error message on register failure", async () => {
    const error = new Error("Registration failed");
    mockRegister.mockRejectedValue(error);
    renderWithRouter(<AuthPage />);
    const switchButton = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchButton);
    await waitForWithTimeout(() => {
      const usernameInput = screen.getByPlaceholderText("Enter your username");
      const emailInput = screen.getByPlaceholderText(/your@email.com/);
      const passwordInput = screen.getByPlaceholderText(
        "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      );
      const submitButton = screen.getByRole("button", {
        name: /Create Account/,
      });
      fireEvent.change(usernameInput, {
        target: {
          value: "newuser",
        },
      });
      fireEvent.change(emailInput, {
        target: {
          value: "new@example.com",
        },
      });
      fireEvent.change(passwordInput, {
        target: {
          value: "password123",
        },
      });
      fireEvent.click(submitButton);
    });
    await waitForWithTimeout(() => {
      expect(screen.getByText("Registration failed")).toBeInTheDocument();
    });
  });
  it("should handle non-Error exception", async () => {
    mockLogin.mockRejectedValue("String error");
    renderWithRouter(<AuthPage />);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    const submitButton = screen.getByRole("button", {
      name: /Sign In/,
    });
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    });
  });
  it("should switch back to login from register", () => {
    renderWithRouter(<AuthPage />);
    const switchToRegister = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchToRegister);
    const switchToLogin = screen.getByText(/Already have an account/i);
    fireEvent.click(switchToLogin);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/your@email.com/),
    ).not.toBeInTheDocument();
  });
  it("should handle form submission with Enter key", async () => {
    mockLogin.mockResolvedValue(void 0);
    renderWithRouter(<AuthPage />);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });
    fireEvent.keyDown(passwordInput, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });
    await waitForWithTimeout(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", "password123", false);
    });
  });
  it("should not submit form when loading", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<AuthPage />);
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });
    const submitButton = screen.getByRole("button", {
      name: /Sign In/,
    });
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(submitButton).toBeDisabled();
    });
    fireEvent.keyDown(passwordInput, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });
    await waitForWithTimeout(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });
  it("should clear error when switching forms", async () => {
    renderWithRouter(<AuthPage />);
    mockLogin.mockRejectedValue(new Error("Login failed"));
    const usernameInput = screen.getByPlaceholderText("Enter your username");
    const passwordInput = screen.getByPlaceholderText(
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    );
    const submitButton = screen.getByRole("button", {
      name: /Sign In/,
    });
    fireEvent.change(usernameInput, {
      target: {
        value: "testuser",
      },
    });
    fireEvent.change(passwordInput, {
      target: {
        value: "password123",
      },
    });
    fireEvent.click(submitButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });
    const switchButton = screen.getByText(/Don't have an account/i);
    fireEvent.click(switchButton);
    await waitForWithTimeout(() => {
      expect(screen.queryByText("Login failed")).not.toBeInTheDocument();
    });
  });
});
