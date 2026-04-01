function isRunningUnderStryker() {
  if (process.env.STRYKER_MUTATOR === "true" || process.env.STRYKER_MUTATOR === "1") {
    return true;
  }
  if (typeof global !== "undefined") {
    if (global.__STRYKER__ || global.stryker) {
      return true;
    }
  }
  if (process.argv) {
    const args = process.argv.join(" ");
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
    const cwd = process.cwd();
    if (cwd.includes(".stryker-tmp") || cwd.includes("sandbox-")) {
      return true;
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
  try {
    const cwd = process.cwd();
    const match = cwd.match(/sandbox-([A-Za-z0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    /* ignore cwd */
  }
  return null;
}
export {
  getStrykerSandboxId,
  isRunningUnderStryker
};
