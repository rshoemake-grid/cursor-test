const headerStrategies = {
  Headers: (headers, base) => {
    headers.forEach((value, key) => {
      base[key.toLowerCase()] = value;
    });
  },
  Array: (headers, base) => {
    headers.forEach(([key, value]) => {
      base[key] = value;
    });
  },
  Object: (headers, base) => {
    Object.assign(base, headers);
  },
};
function addContentTypeIfNeeded(headers, method) {
  if ((method === "POST" || method === "PUT") && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
}
function addAuthorizationIfNeeded(headers, token) {
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
}
function buildBaseHeaders(token, method) {
  const headers = {};
  addAuthorizationIfNeeded(headers, token);
  addContentTypeIfNeeded(headers, method);
  return headers;
}
function mergeHeaders(base, additional) {
  if (additional instanceof Headers) {
    headerStrategies.Headers(additional, base);
  } else if (Array.isArray(additional)) {
    headerStrategies.Array(additional, base);
  } else if (additional && typeof additional === "object") {
    headerStrategies.Object(additional, base);
  }
  return base;
}
export {
  addAuthorizationIfNeeded,
  addContentTypeIfNeeded,
  buildBaseHeaders,
  mergeHeaders,
};
