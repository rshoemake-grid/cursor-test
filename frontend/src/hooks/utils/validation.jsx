function validateWorkflowName(name) {
  const trimmed = name.trim();
  if (trimmed === "") {
    return {
      isValid: false,
      error: "Workflow name cannot be empty.",
    };
  }
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: "Workflow name cannot exceed 100 characters.",
    };
  }
  return { isValid: true };
}
function sanitizeName(name) {
  return name.trim();
}
function isValidName(name) {
  return sanitizeName(name).length > 0;
}
function hasNameChanged(newName, currentName) {
  return sanitizeName(newName) !== sanitizeName(currentName);
}
export { hasNameChanged, isValidName, sanitizeName, validateWorkflowName };
