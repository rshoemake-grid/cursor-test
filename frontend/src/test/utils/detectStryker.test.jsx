import { isRunningUnderStryker, getStrykerSandboxId } from "./detectStryker";
describe("detectStryker", () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd;
  const originalArgv = process.argv;
  const isActuallyRunningUnderStryker = () => {
    try {
      const cwd = process.cwd();
      return cwd.includes(".stryker-tmp") || cwd.includes("sandbox-");
    } catch {
      return false;
    }
  };
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    if (typeof process.cwd !== "function") {
      process.cwd = originalCwd;
    }
  });
  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
    process.argv = originalArgv;
  });
  describe("isRunningUnderStryker", () => {
    const skipIfUnderStryker = isActuallyRunningUnderStryker() ? it.skip : it;
    skipIfUnderStryker("should return false when STRYKER_MUTATOR is not set", () => {
      delete process.env.STRYKER_MUTATOR;
      const mockCwd = jest.fn(() => "/normal/path");
      process.cwd = mockCwd;
      process.argv = ["node", "jest", "test"];
      expect(isRunningUnderStryker()).toBe(false);
    });
    it('should return true when STRYKER_MUTATOR is "true"', () => {
      process.env.STRYKER_MUTATOR = "true";
      expect(isRunningUnderStryker()).toBe(true);
    });
    it('should return true when STRYKER_MUTATOR is "1"', () => {
      process.env.STRYKER_MUTATOR = "1";
      expect(isRunningUnderStryker()).toBe(true);
    });
    skipIfUnderStryker('should return false when STRYKER_MUTATOR is "false"', () => {
      process.env.STRYKER_MUTATOR = "false";
      const mockCwd = jest.fn(() => "/normal/path");
      process.cwd = mockCwd;
      process.argv = ["node", "jest", "test"];
      expect(isRunningUnderStryker()).toBe(false);
    });
    it('should return true when process.argv contains "stryker"', () => {
      process.argv = ["node", "stryker", "run"];
      const mockCwd = jest.fn(() => "/normal/path");
      process.cwd = mockCwd;
      delete process.env.STRYKER_MUTATOR;
      expect(isRunningUnderStryker()).toBe(true);
    });
    it('should return true when process.argv contains "STRYKER"', () => {
      process.argv = ["node", "STRYKER", "run"];
      const mockCwd = jest.fn(() => "/normal/path");
      process.cwd = mockCwd;
      delete process.env.STRYKER_MUTATOR;
      expect(isRunningUnderStryker()).toBe(true);
    });
    skipIfUnderStryker("should return false when process.argv does not contain stryker", () => {
      process.argv = ["node", "jest", "test"];
      const mockCwd = jest.fn(() => "/normal/path");
      process.cwd = mockCwd;
      delete process.env.STRYKER_MUTATOR;
      expect(isRunningUnderStryker()).toBe(false);
    });
  });
  describe("getStrykerSandboxId", () => {
    it("should return null when not running under Stryker", () => {
      delete process.env.STRYKER_MUTATOR;
      expect(getStrykerSandboxId()).toBeNull();
    });
    it("should extract sandbox ID from cwd when present", () => {
      process.env.STRYKER_MUTATOR = "true";
      const mockCwd = jest.fn(() => "/path/to/.stryker-tmp/sandbox-ABC123/src");
      process.cwd = mockCwd;
      expect(getStrykerSandboxId()).toBe("ABC123");
    });
    it("should return null when sandbox ID not found in cwd", () => {
      process.env.STRYKER_MUTATOR = "true";
      const mockCwd = jest.fn(() => "/path/to/src");
      process.cwd = mockCwd;
      expect(getStrykerSandboxId()).toBeNull();
    });
  });
});
