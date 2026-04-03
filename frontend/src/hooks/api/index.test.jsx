import * as apiIndex from "./index";
import { useAuthenticatedApi } from "./index";
import { useAuthenticatedApi as useAuthenticatedApiDirect } from "./useAuthenticatedApi";
describe("hooks/api/index.ts", () => {
  describe("barrel export", () => {
    it("should export useAuthenticatedApi", () => {
      expect(useAuthenticatedApi).toBeDefined();
      expect(typeof useAuthenticatedApi).toBe("function");
    });
    it("should export the same useAuthenticatedApi as the direct import", () => {
      expect(useAuthenticatedApi).toBe(useAuthenticatedApiDirect);
    });
    it("should allow importing useAuthenticatedApi from the barrel export", () => {
      const importedHook = useAuthenticatedApi;
      expect(importedHook).toBeDefined();
      expect(importedHook).toBe(useAuthenticatedApiDirect);
    });
    it("should export useAuthenticatedApi via namespace import", () => {
      expect(apiIndex.useAuthenticatedApi).toBeDefined();
      expect(apiIndex.useAuthenticatedApi).toBe(useAuthenticatedApiDirect);
    });
    it("should maintain consistency with domain pattern", () => {
      expect(useAuthenticatedApi).toBeDefined();
      expect(apiIndex.useAuthenticatedApi).toBeDefined();
    });
    it("should execute the export statement via require", () => {
      const requiredModule = require("./index");
      expect(requiredModule.useAuthenticatedApi).toBeDefined();
      expect(requiredModule.useAuthenticatedApi).toBe(
        useAuthenticatedApiDirect,
      );
    });
  });
});
