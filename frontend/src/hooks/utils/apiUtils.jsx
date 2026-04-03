function buildHeaders(options = {}) {
  const { token, contentType, additionalHeaders = {} } = options;
  const headers = { ...additionalHeaders };
  if (contentType !== null && contentType !== void 0) {
    headers["Content-Type"] = contentType;
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
function buildAuthHeaders(options = {}) {
  return buildHeaders({
    contentType: "application/json",
    ...options,
  });
}
function buildJsonHeaders(additionalHeaders = {}) {
  return buildHeaders({
    contentType: "application/json",
    additionalHeaders,
  });
}
function buildUploadHeaders(additionalHeaders = {}) {
  return buildHeaders({
    contentType: null,
    // Explicitly omit Content-Type for file uploads
    additionalHeaders,
  });
}

function maybeEnhanceNetworkFailureMessage(message) {
  if (typeof message !== "string") {
    return message;
  }
  const t = message.trim().toLowerCase();
  if (
    t === "failed to fetch" ||
    t.includes("networkerror") ||
    t.includes("load failed") ||
    t.includes("network request failed")
  ) {
    return `${message.trim()} — Check that the API server is running. For local dev, start the backend (default http://127.0.0.1:8000), keep REACT_APP_API_BASE_URL empty so requests use /api through the dev proxy, or set PROXY_TARGET if the API uses another host or port.`;
  }
  return message;
}

function extractApiErrorMessage(error, defaultMessage = "An error occurred") {
  if (typeof error === "string") {
    return maybeEnhanceNetworkFailureMessage(error);
  }
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.detail) {
    return error.detail;
  }
  if (error?.message && typeof error.message === "string") {
    return maybeEnhanceNetworkFailureMessage(error.message);
  }
  if (error instanceof Error) {
    return maybeEnhanceNetworkFailureMessage(error.message || defaultMessage);
  }
  return defaultMessage;
}
function isApiResponseOk(response) {
  return response.ok && response.status >= 200 && response.status < 300;
}
async function parseJsonResponse(response) {
  try {
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}
export {
  buildAuthHeaders,
  buildHeaders,
  buildJsonHeaders,
  buildUploadHeaders,
  extractApiErrorMessage,
  isApiResponseOk,
  parseJsonResponse,
};
