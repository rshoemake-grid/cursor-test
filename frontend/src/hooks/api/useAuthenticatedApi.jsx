import { useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { defaultAdapters } from "../../types/adapters";
import { API_CONFIG } from "../../config/constants";
import { createSafeError } from "../../utils/errorFactory";
import {
  executeAuthenticatedRequest,
  HTTP_CLIENT_ERROR_MSG,
  URL_EMPTY_ERROR_MSG
} from "../utils/authenticatedRequestHandler";
import { logicalOr } from "../utils/logicalOr";
import { extractApiErrorMessage } from "../utils/apiUtils";
function useAuthenticatedApi(httpClient, apiBaseUrl) {
  const { token } = useAuth();
  let client;
  try {
    const clientResult = logicalOr(httpClient, defaultAdapters.createHttpClient());
    client = clientResult !== null && clientResult !== void 0 ? clientResult : defaultAdapters.createHttpClient();
  } catch (error) {
    const initError = createSafeError("HTTP client initialization failed", "HttpClientError");
    client = {
      get: () => Promise.reject(initError),
      post: () => Promise.reject(initError),
      put: () => Promise.reject(initError),
      delete: () => Promise.reject(initError)
    };
  }
  const baseUrlResult = logicalOr(apiBaseUrl, API_CONFIG.BASE_URL);
  const baseUrl = baseUrlResult !== null && baseUrlResult !== void 0 && typeof baseUrlResult === "string" ? baseUrlResult : API_CONFIG.BASE_URL;
  const context = {
    client,
    baseUrl,
    token
  };
  const authenticatedPost = useCallback(
    async (endpoint, data, additionalHeaders) => {
      try {
        return await executeAuthenticatedRequest(
          {
            endpoint,
            method: "POST",
            data,
            additionalHeaders
          },
          context
        );
      } catch (error) {
        if (error instanceof Error && (error.name === "HttpClientError" || error.name === "InvalidUrlError" || error.name === "UnsupportedMethodError")) {
          throw error;
        }
        throw createSafeError(
          extractApiErrorMessage(error, "Request failed"),
          "RequestError"
        );
      }
    },
    [token, client, baseUrl]
  );
  const authenticatedGet = useCallback(
    async (endpoint, additionalHeaders) => {
      try {
        return await executeAuthenticatedRequest(
          {
            endpoint,
            method: "GET",
            additionalHeaders
          },
          context
        );
      } catch (error) {
        if (error instanceof Error && (error.name === "HttpClientError" || error.name === "InvalidUrlError" || error.name === "UnsupportedMethodError")) {
          throw error;
        }
        throw createSafeError(
          extractApiErrorMessage(error, "Request failed"),
          "RequestError"
        );
      }
    },
    [token, client, baseUrl]
  );
  const authenticatedPut = useCallback(
    async (endpoint, data, additionalHeaders) => {
      try {
        return await executeAuthenticatedRequest(
          {
            endpoint,
            method: "PUT",
            data,
            additionalHeaders
          },
          context
        );
      } catch (error) {
        if (error instanceof Error && (error.name === "HttpClientError" || error.name === "InvalidUrlError" || error.name === "UnsupportedMethodError")) {
          throw error;
        }
        throw createSafeError(
          extractApiErrorMessage(error, "Request failed"),
          "RequestError"
        );
      }
    },
    [token, client, baseUrl]
  );
  const authenticatedDelete = useCallback(
    async (endpoint, additionalHeaders) => {
      try {
        return await executeAuthenticatedRequest(
          {
            endpoint,
            method: "DELETE",
            additionalHeaders
          },
          context
        );
      } catch (error) {
        if (error instanceof Error && (error.name === "HttpClientError" || error.name === "InvalidUrlError" || error.name === "UnsupportedMethodError")) {
          throw error;
        }
        throw createSafeError(
          extractApiErrorMessage(error, "Request failed"),
          "RequestError"
        );
      }
    },
    [token, client, baseUrl]
  );
  return {
    authenticatedPost,
    authenticatedGet,
    authenticatedPut,
    authenticatedDelete
  };
}
export {
  HTTP_CLIENT_ERROR_MSG,
  URL_EMPTY_ERROR_MSG,
  useAuthenticatedApi
};
