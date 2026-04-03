import { waitFor } from "@testing-library/react";
import { isRunningUnderStryker } from "./detectStryker";
async function waitForStateValue(getValue, expectedValue, timeout) {
  const defaultTimeout = isRunningUnderStryker() ? 6e4 : 3e4;
  const actualTimeout = timeout ?? defaultTimeout;
  await waitFor(
    () => {
      const currentValue = getValue();
      expect(currentValue).toBe(expectedValue);
    },
    { timeout: actualTimeout },
  );
}
async function waitForArrayLength(getArray, minLength = 1, timeout) {
  const defaultTimeout = isRunningUnderStryker() ? 6e4 : 3e4;
  const actualTimeout = timeout ?? defaultTimeout;
  await waitFor(
    () => {
      const array = getArray();
      expect(array).toBeDefined();
      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBeGreaterThanOrEqual(minLength);
    },
    { timeout: actualTimeout },
  );
}
async function waitForCondition(condition, timeout) {
  const defaultTimeout = isRunningUnderStryker() ? 6e4 : 3e4;
  const actualTimeout = timeout ?? defaultTimeout;
  await waitFor(
    () => {
      expect(condition()).toBe(true);
    },
    { timeout: actualTimeout },
  );
}
export { waitForArrayLength, waitForCondition, waitForStateValue };
