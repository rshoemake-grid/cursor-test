function getNodeProcess() {
  return typeof process !== "undefined" ? process : void 0;
}

function isRunningUnderStryker() {
  const proc = getNodeProcess();
  if (!proc) {
    return false;
  }
  const env = proc.env;
  if (env && (env.STRYKER_MUTATOR === "true" || env.STRYKER_MUTATOR === "1")) {
    return true;
  }
  if (typeof global !== "undefined") {
    if (global.__STRYKER__ || global.stryker) {
      return true;
    }
  }
  if (proc.argv && Array.isArray(proc.argv)) {
    const args = proc.argv.join(" ");
    if (args.includes("stryker") || args.includes("STRYKER")) {
      return true;
    }
  }
  if (typeof __dirname !== "undefined") {
    if (__dirname.includes(".stryker-tmp") || __dirname.includes("sandbox-")) {
      return true;
    }
  }
  try {
    if (typeof proc.cwd === "function") {
      const cwd = proc.cwd();
      if (cwd.includes(".stryker-tmp") || cwd.includes("sandbox-")) {
        return true;
      }
    }
  } catch {
    /* ignore cwd */
  }
  return false;
}

function getStrykerSandboxId() {
  if (!isRunningUnderStryker()) {
    return null;
  }
  const proc = getNodeProcess();
  if (!proc || typeof proc.cwd !== "function") {
    return null;
  }
  try {
    const cwd = proc.cwd();
    const match = cwd.match(/sandbox-([A-Za-z0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    /* ignore cwd */
  }
  return null;
}

export { getStrykerSandboxId, isRunningUnderStryker };
