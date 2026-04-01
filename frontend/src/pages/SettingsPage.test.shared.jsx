import { jsx } from "react/jsx-runtime";
import { render, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showSuccess, showError } from "../utils/notifications";
import { showConfirm } from "../utils/confirm";
import { api } from "../api/client";
const waitForWithTimeout = async (callback, timeout = 2e3) => {
  return await waitFor(callback, { timeout });
};
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn()
}));
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn()
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn()
}));
jest.mock("../api/client", () => ({
  api: {
    getLLMSettings: jest.fn()
  },
  createApiClient: jest.fn()
}));
global.fetch = jest.fn();
const mockUseAuth = useAuth;
const mockShowSuccess = showSuccess;
const mockShowError = showError;
const mockApi = api;
const renderWithRouter = (component) => {
  return render(/* @__PURE__ */ jsx(BrowserRouter, { children: component }));
};
const setupMocks = () => {
  jest.clearAllMocks();
  localStorage.clear();
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: { id: "1", username: "testuser" },
    token: "token",
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn()
  });
  showConfirm.mockResolvedValue(true);
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ providers: [], iteration_limit: 10, default_model: "" })
  });
  mockApi.getLLMSettings = jest.fn().mockResolvedValue({
    providers: [],
    iteration_limit: 10,
    default_model: ""
  });
};
export {
  mockApi,
  mockShowError,
  mockShowSuccess,
  mockUseAuth,
  renderWithRouter,
  setupMocks,
  showConfirm,
  waitForWithTimeout
};
