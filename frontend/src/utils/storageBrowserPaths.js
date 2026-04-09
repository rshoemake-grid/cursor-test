/**
 * Path helpers for GCS/S3 object key prefixes vs server local absolute paths.
 */

/** Last path segment for a file path (empty if none). */
function fileBasenameFromPath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  const norm = filePath.trim().replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  if (i < 0) {
    return norm;
  }
  return norm.slice(i + 1) || "";
}

/** Single file name only (no directories); takes basename if user pasted a path. */
function sanitizeNewLocalFileName(input) {
  const t = String(input ?? "").trim().replace(/\\/g, "/");
  if (!t) {
    return "";
  }
  const parts = t.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

/**
 * Join a browsed directory with a new or existing file name (absolute path on server).
 */
function joinLocalDirectoryAndFilename(directory, fileName) {
  const name = sanitizeNewLocalFileName(fileName);
  if (!name) {
    return "";
  }
  const normDir = String(directory ?? "").replace(/\\/g, "/");
  if (normDir === "/") {
    return `/${name}`;
  }
  const dirRaw = normDir.replace(/\/+$/, "");
  if (!dirRaw) {
    return name;
  }
  return `${dirRaw}/${name}`;
}

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

/**
 * Whether the local list-directory response allows navigating to the parent folder.
 * Honors can_go_up / canGoUp from the API when set; if omitted, infers from directory vs base_path.
 */
function deriveLocalListCanGoUp(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  const fromApi = data.can_go_up ?? data.canGoUp;
  if (fromApi === true) {
    return true;
  }
  if (fromApi === false) {
    return false;
  }
  const norm = (p) => String(p ?? "").replace(/\\/g, "/").replace(/\/+$/, "");
  const dirN = norm(data.directory);
  const baseN = norm(data.base_path);
  if (!dirN || dirN === baseN) {
    return false;
  }
  if (!baseN) {
    return dirN.includes("/");
  }
  return dirN.startsWith(`${baseN}/`);
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
  deriveLocalListCanGoUp,
  fileBasenameFromPath,
  sanitizeNewLocalFileName,
  joinLocalDirectoryAndFilename,
  formatStorageSize,
};
