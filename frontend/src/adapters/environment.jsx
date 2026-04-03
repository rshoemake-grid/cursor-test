const EnvironmentAdapterFactory = {
  /**
   * Create default environment adapter
   */
  createEnvironmentAdapter() {
    return {
      isDevelopment: () =>
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV !== "production",
      isProduction: () => process.env.NODE_ENV === "production",
      get: (key) => process.env[key],
    };
  },
};
export { EnvironmentAdapterFactory };
