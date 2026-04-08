import {
  browsePrefixFromObjectKey,
  parentObjectKeyPrefix,
  browseDirectoryFromFilePath,
  parentLocalDirectory,
  formatStorageSize,
} from "./storageBrowserPaths";

describe("storageBrowserPaths", () => {
  describe("browsePrefixFromObjectKey", () => {
    it("returns empty for shallow keys", () => {
      expect(browsePrefixFromObjectKey("")).toBe("");
      expect(browsePrefixFromObjectKey("file.txt")).toBe("");
    });
    it("returns key prefix with slash", () => {
      expect(browsePrefixFromObjectKey("data/file.txt")).toBe("data/");
    });
  });
  describe("parentObjectKeyPrefix", () => {
    it("walks up key prefixes", () => {
      expect(parentObjectKeyPrefix("a/b/c/")).toBe("a/b/");
      expect(parentObjectKeyPrefix("a/")).toBe("");
    });
  });
  describe("browseDirectoryFromFilePath", () => {
    it("returns parent directory path without trailing slash", () => {
      expect(browseDirectoryFromFilePath("/var/log/app.log")).toBe("/var/log");
      expect(browseDirectoryFromFilePath("fileonly.txt")).toBe("");
    });
  });
  describe("parentLocalDirectory", () => {
    it("returns parent absolute dir without trailing slashes", () => {
      expect(parentLocalDirectory("/home/user/proj")).toBe("/home/user");
      expect(parentLocalDirectory("/")).toBe("");
    });
  });
  describe("formatStorageSize", () => {
    it("formats bytes", () => {
      expect(formatStorageSize(100)).toContain("B");
      expect(formatStorageSize(2048)).toContain("KB");
    });
  });
});
