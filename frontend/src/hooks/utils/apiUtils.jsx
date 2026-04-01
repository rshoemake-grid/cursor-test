function buildHeaders(options = {}) {
  const {
    token,
    contentType,
    additionalHeaders = {}
  } = options;
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
    ...options
  });
}
function buildJsonHeaders(additionalHeaders = {}) {
  return buildHeaders({
    contentType: "application/json",
    additionalHeaders
  });
}
function buildUploadHeaders(additionalHeaders = {}) {
  return buildHeaders({
    contentType: null,
    // Explicitly omit Content-Type for file uploads
    additionalHeaders
  });
}
function extractApiErrorMessage(error, defaultMessage = "An error occurred") {
  if (typeof error === "string") {
    return error;
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
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || defaultMessage;
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
  parseJsonResponse
};
