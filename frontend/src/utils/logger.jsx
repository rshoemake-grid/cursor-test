const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV !== "production";
const logger = {
  debug: (...args) => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },
  info: (...args) => {
    if (isDev) {
      console.info("[INFO]", ...args);
    }
  },
  warn: (...args) => {
    console.warn("[WARN]", ...args);
  },
  error: (...args) => {
    console.error("[ERROR]", ...args);
  },
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  }
};
export {
  logger
};
