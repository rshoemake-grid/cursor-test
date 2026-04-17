import {
  browsePrefixFromObjectKey,
  parentObjectKeyPrefix,
  browseDirectoryFromFilePath,
  parentLocalDirectory,
  deriveLocalListCanGoUp,
  fileBasenameFromPath,
  sanitizeNewLocalFileName,
  joinLocalDirectoryAndFilename,
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
    it("returns root when current folder is one segment under root (e.g. /Users)", () => {
      expect(parentLocalDirectory("/Users")).toBe("/");
      expect(parentLocalDirectory("/var")).toBe("/");
    });
  });
  describe("fileBasenameFromPath", () => {
    it("returns the last segment", () => {
      expect(fileBasenameFromPath("/var/log/app.log")).toBe("app.log");
      expect(fileBasenameFromPath("only.txt")).toBe("only.txt");
      expect(fileBasenameFromPath("")).toBe("");
    });
  });
  describe("sanitizeNewLocalFileName", () => {
    it("trims and uses basename for pasted paths", () => {
      expect(sanitizeNewLocalFileName("  out.txt  ")).toBe("out.txt");
      expect(sanitizeNewLocalFileName("dir/sub/file.txt")).toBe("file.txt");
    });
  });
  describe("joinLocalDirectoryAndFilename", () => {
    it("joins directory and file name", () => {
      expect(joinLocalDirectoryAndFilename("/tmp", "a.txt")).toBe("/tmp/a.txt");
      expect(joinLocalDirectoryAndFilename("/tmp/", "a.txt")).toBe("/tmp/a.txt");
      expect(joinLocalDirectoryAndFilename("/", "x")).toBe("/x");
    });
    it("returns empty when file name is empty", () => {
      expect(joinLocalDirectoryAndFilename("/tmp", "")).toBe("");
      expect(joinLocalDirectoryAndFilename("/tmp", "   ")).toBe("");
    });
  });
  describe("deriveLocalListCanGoUp", () => {
    it("returns false for invalid input", () => {
      expect(deriveLocalListCanGoUp(null)).toBe(false);
      expect(deriveLocalListCanGoUp(undefined)).toBe(false);
    });
    it("honors explicit API booleans", () => {
      expect(
        deriveLocalListCanGoUp({
          can_go_up: true,
          directory: "/x",
          base_path: "/x",
        }),
      ).toBe(true);
      expect(
        deriveLocalListCanGoUp({
          can_go_up: false,
          directory: "/x/y",
          base_path: "/x",
        }),
      ).toBe(false);
      expect(
        deriveLocalListCanGoUp({
          canGoUp: true,
          directory: "/a",
          base_path: "/a",
        }),
      ).toBe(true);
    });
    it("infers from directory vs base_path when flag is absent", () => {
      expect(
        deriveLocalListCanGoUp({
          directory: "/data/sub",
          base_path: "/data",
        }),
      ).toBe(true);
      expect(
        deriveLocalListCanGoUp({
          directory: "/data",
          base_path: "/data",
        }),
      ).toBe(false);
    });
    it("allows parent when base is empty and directory is nested", () => {
      expect(
        deriveLocalListCanGoUp({
          directory: "/a/b",
          base_path: "",
        }),
      ).toBe(true);
    });
  });
  describe("formatStorageSize", () => {
    it("formats bytes", () => {
      expect(formatStorageSize(100)).toContain("B");
      expect(formatStorageSize(2048)).toContain("KB");
    });
  });
});
