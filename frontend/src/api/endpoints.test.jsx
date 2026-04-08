import {
  workflowEndpoints,
  executionEndpoints,
  templateEndpoints,
  marketplaceEndpoints,
  settingsEndpoints,
  storageEndpoints,
} from "./endpoints";
describe("endpoints", () => {
  describe("workflowEndpoints", () => {
    it("should return correct list endpoint", () => {
      expect(workflowEndpoints.list()).toBe("/workflows");
    });
    it("should return correct detail endpoint with id", () => {
      expect(workflowEndpoints.detail("workflow-123")).toBe(
        "/workflows/workflow-123",
      );
    });
    it("should return correct execute endpoint with id", () => {
      expect(workflowEndpoints.execute("workflow-123")).toBe(
        "/workflows/workflow-123/execute",
      );
    });
    it("should return correct publish endpoint with id", () => {
      expect(workflowEndpoints.publish("workflow-123")).toBe(
        "/workflows/workflow-123/publish",
      );
    });
    it("should return correct bulkDelete endpoint", () => {
      expect(workflowEndpoints.bulkDelete()).toBe("/workflows/bulk-delete");
    });
  });
  describe("executionEndpoints", () => {
    it("should return correct detail endpoint with id", () => {
      expect(executionEndpoints.detail("execution-123")).toBe(
        "/executions/execution-123",
      );
    });
  });
  describe("templateEndpoints", () => {
    it("should return correct delete endpoint with id", () => {
      expect(templateEndpoints.delete("template-123")).toBe(
        "/templates/template-123",
      );
    });
  });
  describe("marketplaceEndpoints", () => {
    it("should return correct agents endpoint", () => {
      expect(marketplaceEndpoints.agents()).toBe("/marketplace/agents");
    });
  });
  describe("settingsEndpoints", () => {
    it("should return correct llm endpoint", () => {
      expect(settingsEndpoints.llm()).toBe("/settings/llm");
    });
  });
  describe("storageEndpoints", () => {
    it("should return GCP list-objects endpoint", () => {
      expect(storageEndpoints.gcpListObjects()).toBe(
        "/storage/gcp/list-objects",
      );
    });
    it("should return GCP list-buckets endpoint", () => {
      expect(storageEndpoints.gcpListBuckets()).toBe(
        "/storage/gcp/list-buckets",
      );
    });
    it("should return GCP list-projects endpoint", () => {
      expect(storageEndpoints.gcpListProjects()).toBe(
        "/storage/gcp/list-projects",
      );
    });
    it("should return AWS list-objects endpoint", () => {
      expect(storageEndpoints.awsListObjects()).toBe(
        "/storage/aws/list-objects",
      );
    });
    it("should return AWS list-buckets endpoint", () => {
      expect(storageEndpoints.awsListBuckets()).toBe(
        "/storage/aws/list-buckets",
      );
    });
    it("should return AWS list-regions endpoint", () => {
      expect(storageEndpoints.awsListRegions()).toBe(
        "/storage/aws/list-regions",
      );
    });
    it("should return local list-directory endpoint", () => {
      expect(storageEndpoints.localListDirectory()).toBe(
        "/storage/local/list-directory",
      );
    });
  });
});
