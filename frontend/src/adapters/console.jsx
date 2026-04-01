const ConsoleAdapterFactory = {
  /**
   * Create default console adapter
   */
  createConsoleAdapter() {
    if (typeof console === "undefined") {
      return {
        log: () => {
        },
        info: () => {
        },
        warn: () => {
        },
        error: () => {
        },
        debug: () => {
        }
      };
    }
    return {
      log: (...args) => console.log(...args),
      info: (...args) => console.info(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => console.error(...args),
      debug: (...args) => {
        if (console.debug) {
          console.debug(...args);
        } else {
          console.log(...args);
        }
      }
    };
  }
};
export {
  ConsoleAdapterFactory
};
