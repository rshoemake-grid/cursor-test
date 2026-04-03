import { createSafeError } from "../../utils/errorFactory";
import { mergeHeaders, buildBaseHeaders } from "./headerMerging";
const HTTP_CLIENT_ERROR_MSG = "HTTP client is not properly initialized";
const URL_EMPTY_ERROR_MSG = "URL cannot be empty";
function validateRequest(config, context) {
  const methodName = config.method.toLowerCase();
  if (!context.client || typeof context.client[methodName] !== "function") {
    return createSafeError(HTTP_CLIENT_ERROR_MSG, "HttpClientError");
  }
  const url = `${context.baseUrl}${config.endpoint}`;
  if (!url || url.trim() === "") {
    return createSafeError(URL_EMPTY_ERROR_MSG, "InvalidUrlError");
  }
  return null;
}
function buildRequestHeaders(token, method, additionalHeaders) {
  const headers = {};
  if (additionalHeaders) {
    mergeHeaders(headers, additionalHeaders);
  }
  const baseHeaders = buildBaseHeaders(token, method);
  if (baseHeaders.Authorization) {
    headers.Authorization = baseHeaders.Authorization;
  }
  if (baseHeaders["Content-Type"] && !headers["Content-Type"]) {
    headers["Content-Type"] = baseHeaders["Content-Type"];
  }
  return headers;
}
function executeAuthenticatedRequest(config, context) {
  const validationError = validateRequest(config, context);
  if (validationError) {
    return Promise.reject(validationError);
  }
  const headers = buildRequestHeaders(
    context.token,
    config.method,
    config.additionalHeaders,
  );
  const url = `${context.baseUrl}${config.endpoint}`;
  const methodMap = {
    GET: () => context.client.get(url, headers),
    POST: () => context.client.post(url, config.data, headers),
    PUT: () => context.client.put(url, config.data, headers),
    DELETE: () => context.client.delete(url, headers),
  };
  const requestFn = methodMap[config.method];
  if (!requestFn) {
    return Promise.reject(
      createSafeError(
        `Unsupported HTTP method: ${config.method}`,
        "UnsupportedMethodError",
      ),
    );
  }
  try {
    return requestFn();
  } catch (error) {
    return Promise.reject(error);
  }
}
export {
  HTTP_CLIENT_ERROR_MSG,
  URL_EMPTY_ERROR_MSG,
  buildRequestHeaders,
  executeAuthenticatedRequest,
  validateRequest,
};
