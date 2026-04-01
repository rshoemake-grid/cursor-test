import { safeGetTabsRefCurrent } from "./safeRefs";
describe("safeGetTabsRefCurrent", () => {
  it("should return null when tabsRef is null", () => {
    const result = safeGetTabsRefCurrent(null);
    expect(result).toBeNull();
  });
  it("should return null when tabsRef is undefined", () => {
    const result = safeGetTabsRefCurrent(void 0);
    expect(result).toBeNull();
  });
  it("should return null when tabsRef.current is null", () => {
    const tabsRef = {
      current: null
    };
    const result = safeGetTabsRefCurrent(tabsRef);
    expect(result).toBeNull();
  });
  it("should return null when tabsRef.current is undefined", () => {
    const tabsRef = {
      current: void 0
    };
    const result = safeGetTabsRefCurrent(tabsRef);
    expect(result).toBeNull();
  });
  it("should return valid array when tabsRef.current is valid", () => {
    const validArray = [{ id: "1" }, { id: "2" }];
    const tabsRef = {
      current: validArray
    };
    const result = safeGetTabsRefCurrent(tabsRef);
    expect(result).toBe(validArray);
    expect(result).toEqual(validArray);
  });
  it("should catch and handle property access errors", () => {
    const tabsRef = new Proxy(
      {},
      {
        get: () => {
          throw new Error("Property access error");
        }
      }
    );
    const result = safeGetTabsRefCurrent(tabsRef);
    expect(result).toBeNull();
  });
  it("should return valid value for non-array types", () => {
    const validObject = { test: "value" };
    const tabsRef = {
      current: validObject
    };
    const result = safeGetTabsRefCurrent(tabsRef);
    expect(result).toBe(validObject);
  });
});
