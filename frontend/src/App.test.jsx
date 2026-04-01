import { jsx, jsxs } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, {
    timeout
  });
};
import App from "./App";
jest.mock("./components/WorkflowTabs", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "WorkflowTabs"
    })
  };
});
jest.mock("./components/WorkflowList", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({
      onSelectWorkflow,
      onBack
    }) => /* @__PURE__ */jsxs("div", {
      children: [/* @__PURE__ */jsx("div", {
        children: "WorkflowList"
      }), /* @__PURE__ */jsx("button", {
        onClick: () => onSelectWorkflow("workflow-1"),
        children: "Select"
      }), /* @__PURE__ */jsx("button", {
        onClick: onBack,
        children: "Back"
      })]
    })
  };
});
jest.mock("./components/ExecutionViewer", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: ({
      executionId
    }) => /* @__PURE__ */jsxs("div", {
      children: ["ExecutionViewer: ", executionId]
    })
  };
});
jest.mock("./pages/AuthPage", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "AuthPage"
    })
  };
});
jest.mock("./pages/ForgotPasswordPage", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "ForgotPasswordPage"
    })
  };
});
jest.mock("./pages/ResetPasswordPage", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "ResetPasswordPage"
    })
  };
});
jest.mock("./pages/MarketplacePage", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "MarketplacePage"
    })
  };
});
jest.mock("./pages/SettingsPage", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "SettingsPage"
    })
  };
});
jest.mock("./pages/LogPage", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    default: () => /* @__PURE__ */jsx("div", {
      children: "LogPage"
    })
  };
});
jest.mock("./utils/confirm", () => ({
  showConfirm: jest.fn().mockResolvedValue(true)
}));
const renderApp = () => {
  return render(/* @__PURE__ */jsx(App, {}));
};
describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, "", "/");
  });
  it("should render auth page at /auth route", () => {
    window.history.pushState({}, "", "/auth");
    renderApp();
    expect(screen.getByText("AuthPage")).toBeInTheDocument();
  });
  it("should render forgot password page at /forgot-password route", () => {
    window.history.pushState({}, "", "/forgot-password");
    renderApp();
    expect(screen.getByText("ForgotPasswordPage")).toBeInTheDocument();
  });
  it("should render reset password page at /reset-password route", () => {
    window.history.pushState({}, "", "/reset-password");
    renderApp();
    expect(screen.getByText("ResetPasswordPage")).toBeInTheDocument();
  });
  it("should render authenticated layout at root route", () => {
    window.history.pushState({}, "", "/");
    renderApp();
    expect(screen.getByText(/Agentic Workflow Builder/)).toBeInTheDocument();
  });
  it("should render log page at /log route", () => {
    window.history.pushState({}, "", "/log");
    renderApp();
    expect(screen.getByText("LogPage")).toBeInTheDocument();
  });
  it("should render marketplace page at /marketplace route", () => {
    window.history.pushState({}, "", "/marketplace");
    renderApp();
    expect(screen.getByText("MarketplacePage")).toBeInTheDocument();
  });
  it("should render settings page at /settings route", () => {
    window.history.pushState({}, "", "/settings");
    renderApp();
    expect(screen.getByText("SettingsPage")).toBeInTheDocument();
  });
  it("should render workflow tabs in builder view", () => {
    window.history.pushState({}, "", "/");
    renderApp();
    expect(screen.getByText("WorkflowTabs")).toBeInTheDocument();
  });
  it("should render navigation buttons", () => {
    window.history.pushState({}, "", "/");
    renderApp();
    expect(screen.getByText("Builder")).toBeInTheDocument();
    expect(screen.getByText("Workflows")).toBeInTheDocument();
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
  describe("AuthenticatedLayout navigation", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      window.history.pushState({}, "", "/");
    });
    it("should switch to list view when Workflows button is clicked", () => {
      renderApp();
      const workflowsButton = screen.getByText("Workflows");
      fireEvent.click(workflowsButton);
      expect(screen.getByText("WorkflowList")).toBeInTheDocument();
    });
    it("should switch back to builder view when Builder button is clicked", async () => {
      renderApp();
      const workflowsButton = screen.getByText("Workflows");
      fireEvent.click(workflowsButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("WorkflowList")).toBeInTheDocument();
      });
      const builderButton = screen.getByText("Builder");
      fireEvent.click(builderButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("WorkflowTabs")).toBeInTheDocument();
      });
    });
    it("should show Execution button when executionId is set", () => {
      renderApp();
      expect(screen.queryByText("Execution")).not.toBeInTheDocument();
    });
    it("should handle workflow selection from WorkflowList", async () => {
      renderApp();
      const workflowsButton = screen.getByText("Workflows");
      fireEvent.click(workflowsButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("WorkflowList")).toBeInTheDocument();
      });
      const selectButton = screen.getByText("Select");
      fireEvent.click(selectButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("WorkflowTabs")).toBeInTheDocument();
      });
    });
    it("should navigate to execution view when execution query param is present", async () => {
      window.history.pushState({}, "", "/?execution=exec-123");
      renderApp();
      await waitForWithTimeout(() => {
        expect(screen.getByText("ExecutionViewer: exec-123")).toBeInTheDocument();
      });
    });
    it("should handle back button from WorkflowList", async () => {
      renderApp();
      const workflowsButton = screen.getByText("Workflows");
      fireEvent.click(workflowsButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("WorkflowList")).toBeInTheDocument();
      });
      const backButton = screen.getByText("Back");
      fireEvent.click(backButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("WorkflowTabs")).toBeInTheDocument();
      });
    });
  });
  describe("Logout flow", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      window.history.pushState({}, "", "/");
    });
    it("should render authenticated layout", () => {
      renderApp();
      expect(screen.getByText(/Agentic Workflow Builder/)).toBeInTheDocument();
    });
  });
  describe("URL workflow loading", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should handle workflow parameter in URL", () => {
      window.history.pushState({}, "", "/?workflow=workflow-123");
      renderApp();
      expect(screen.getByText(/Agentic Workflow Builder/)).toBeInTheDocument();
    });
  });
});
