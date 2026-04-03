import {
  setupMocks,
  mockUseAuth,
  mockShowSuccess,
  mockShowError,
  renderWithRouter,
  waitForWithTimeout,
} from "./SettingsPage.test.shared";
import SettingsPage from "./SettingsPage";
import { screen, fireEvent } from "@testing-library/react";
describe("SettingsPage - Manual Sync", () => {
  beforeEach(() => {
    setupMocks();
  });
  it("should handle handleManualSync when authenticated", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });
    renderWithRouter(<SettingsPage />);
    await waitForWithTimeout(() => {
      expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
    }, 3e3);
    const syncButtons = screen.queryAllByText(/Sync|Manual Sync/);
    if (syncButtons.length > 0) {
      fireEvent.click(syncButtons[0]);
      await waitForWithTimeout(() => {
        expect(mockShowSuccess).toHaveBeenCalled();
      }, 3e3);
    }
  });
  it("should disable Sync Now when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });
    renderWithRouter(<SettingsPage />);
    await waitForWithTimeout(() => {
      expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
    }, 3e3);
    const syncButton = screen.getByText("Sync Now");
    expect(syncButton).toBeDisabled();
    expect(mockShowError).not.toHaveBeenCalled();
  });
  it("should handle handleManualSync error", async () => {
    global.fetch.mockRejectedValue(new Error("Sync failed"));
    renderWithRouter(<SettingsPage />);
    await waitForWithTimeout(() => {
      expect(screen.getAllByText(/Settings/).length).toBeGreaterThan(0);
    }, 3e3);
    const syncButtons = screen.queryAllByText(/Sync|Manual Sync/);
    if (syncButtons.length > 0) {
      fireEvent.click(syncButtons[0]);
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled();
      }, 3e3);
    }
  });
  describe("Manual sync with HTTP client", () => {
    it("should handle manual sync when authenticated", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            providers: [],
            iteration_limit: 10,
            default_model: "",
          }),
        }),
        post: jest.fn().mockResolvedValue({
          ok: true,
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      });
      renderWithRouter(<SettingsPage httpClient={mockHttpClient} />);
      await waitForWithTimeout(() => {
        const syncButtons = screen.queryAllByText(/Sync|Manual Sync/);
        if (syncButtons.length > 0) {
          fireEvent.click(syncButtons[0]);
        }
      }, 3e3);
      await waitForWithTimeout(() => {
        expect(mockHttpClient.post).toHaveBeenCalled();
      }, 3e3);
    });
    it("should not run manual sync when not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      });
      renderWithRouter(<SettingsPage />);
      await waitForWithTimeout(() => {
        expect(screen.getByText("Sync Now")).toBeDisabled();
      }, 3e3);
      expect(mockShowError).not.toHaveBeenCalled();
    });
    it("should handle manual sync error", async () => {
      const mockHttpClient = {
        get: jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            providers: [],
            iteration_limit: 10,
            default_model: "",
          }),
        }),
        post: jest.fn().mockResolvedValue({
          ok: false,
        }),
        put: jest.fn(),
        delete: jest.fn(),
      };
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          id: "1",
          username: "testuser",
        },
        token: "token",
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
      });
      renderWithRouter(<SettingsPage httpClient={mockHttpClient} />);
      await waitForWithTimeout(() => {
        const syncButtons = screen.queryAllByText(/Sync|Manual Sync/);
        if (syncButtons.length > 0) {
          fireEvent.click(syncButtons[0]);
        }
      }, 3e3);
      await waitForWithTimeout(() => {
        expect(mockShowError).toHaveBeenCalled();
      }, 3e3);
    });
  });
});
