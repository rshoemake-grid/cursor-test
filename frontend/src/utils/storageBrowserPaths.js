/**
 * Path helpers for GCS/S3 object key prefixes vs server local absolute paths.
 */

function browsePrefixFromObjectKey(objectKey) {
  if (!objectKey || typeof objectKey !== "string") {
    return "";
  }
  const t = objectKey.trim();
  if (!t.includes("/")) {
    return "";
  }
  const i = t.lastIndexOf("/");
  return t.slice(0, i + 1);
}

function parentObjectKeyPrefix(prefix) {
  if (!prefix) {
    return "";
  }
  const trimmed = prefix.replace(/\/+$/, "");
  if (!trimmed.includes("/")) {
    return "";
  }
  const parts = trimmed.split("/");
  parts.pop();
  return parts.length ? `${parts.join("/")}/` : "";
}

function browseDirectoryFromFilePath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  const norm = filePath.trim().replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  if (i < 0) {
    return "";
  }
  return norm.slice(0, i).replace(/\/+$/, "") || "";
}

function parentLocalDirectory(absoluteDir) {
  const t = (absoluteDir || "").replace(/\/+$/, "");
  if (!t) {
    return "";
  }
  const i = t.lastIndexOf("/");
  if (i <= 0) {
    return "";
  }
  return t.slice(0, i);
}

function formatStorageSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export {
  browsePrefixFromObjectKey,
  parentObjectKeyPrefix,
  browseDirectoryFromFilePath,
  parentLocalDirectory,
  formatStorageSize,
};
