function createSafeError(message, name) {
  try {
    const error = new Error(message ?? "");
    error.name = name ?? "Error";
    return error;
  } catch {
    try {
      const error = Object.create(Error.prototype);
      error.message = message ?? "";
      error.name = name ?? "Error";
      error.stack = "";
      return error;
    } catch {
      return {
        message: message ?? "",
        // Preserve empty string if provided, otherwise use 'Error' as default
        name: name ?? "Error",
        stack: ""
      };
    }
  }
}
export {
  createSafeError
};
