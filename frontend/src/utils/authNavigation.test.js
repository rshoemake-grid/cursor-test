import { STORAGE_KEYS } from "../config/constants";
import { getPostAuthNavigationTarget } from "./authNavigation";

describe("getPostAuthNavigationTarget", () => {
  it("returns / when no snapshot and no from", () => {
    const storage = {
      getItem: jest.fn(() => null),
      removeItem: jest.fn(),
    };
    const r = getPostAuthNavigationTarget(storage, {});
    expect(r).toEqual({ target: "/", state: undefined });
  });

  it("uses session snapshot and removes key", () => {
    const ctx = {
      pathname: "/",
      search: "?workflow=w1",
      currentView: "builder",
      executionId: null,
      selectedWorkflowId: "w1",
    };
    const storage = {
      getItem: jest.fn(() => JSON.stringify(ctx)),
      removeItem: jest.fn(),
    };
    const r = getPostAuthNavigationTarget(storage, {});
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_RETURN_CONTEXT);
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_RETURN_CONTEXT);
    expect(r.target).toBe("/?workflow=w1");
    expect(r.state).toEqual({ authRestore: ctx });
  });

  it("falls back to location.state.from when no snapshot", () => {
    const storage = {
      getItem: jest.fn(() => null),
      removeItem: jest.fn(),
    };
    const r = getPostAuthNavigationTarget(storage, { from: "/settings" });
    expect(r.target).toBe("/settings");
    expect(r.state).toBeUndefined();
  });

  it("ignores from when it is /auth", () => {
    const storage = {
      getItem: jest.fn(() => null),
      removeItem: jest.fn(),
    };
    const r = getPostAuthNavigationTarget(storage, { from: "/auth" });
    expect(r.target).toBe("/");
  });
});
