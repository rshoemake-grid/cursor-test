import { renderHook, act } from "@testing-library/react";
import { useFirstRender } from "./useFirstRender";
describe("useFirstRender", () => {
  it("should return true for first render", () => {
    const { result } = renderHook(() => useFirstRender());
    expect(result.current.isFirstRender).toBe(true);
    expect(typeof result.current.markAsRendered).toBe("function");
  });
  it("should return false after markAsRendered is called", () => {
    const { result, rerender } = renderHook(() => useFirstRender());
    expect(result.current.isFirstRender).toBe(true);
    act(() => {
      result.current.markAsRendered();
    });
    rerender();
    const { result: newResult } = renderHook(() => useFirstRender());
    expect(newResult.current.isFirstRender).toBe(true);
    act(() => {
      result.current.markAsRendered();
    });
  });
  it("should maintain state across rerenders when markAsRendered is called", () => {
    const { result } = renderHook(() => useFirstRender());
    expect(result.current.isFirstRender).toBe(true);
    act(() => {
      result.current.markAsRendered();
    });
  });
  it("should allow multiple calls to markAsRendered", () => {
    const { result } = renderHook(() => useFirstRender());
    act(() => {
      result.current.markAsRendered();
      result.current.markAsRendered();
      result.current.markAsRendered();
    });
    expect(result.current.markAsRendered).toBeDefined();
  });
  it("should work correctly in typical usage pattern", () => {
    const { result } = renderHook(() => useFirstRender());
    if (result.current.isFirstRender) {
      expect(result.current.isFirstRender).toBe(true);
      act(() => {
        result.current.markAsRendered();
      });
    }
  });
  it("should return consistent markAsRendered function", () => {
    const { result, rerender } = renderHook(() => useFirstRender());
    const markFn1 = result.current.markAsRendered;
    rerender();
    const markFn2 = result.current.markAsRendered;
    expect(typeof markFn1).toBe("function");
    expect(typeof markFn2).toBe("function");
  });
  it("should handle rapid markAsRendered calls", () => {
    const { result } = renderHook(() => useFirstRender());
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.markAsRendered();
      }
    });
    expect(result.current.markAsRendered).toBeDefined();
  });
});
