import { isBrowserEnvironment } from "../utils/environment";
const DEFAULT_LOCATION = {
  protocol: "http:",
  host: "localhost:8000",
  hostname: "localhost",
  port: "8000",
  pathname: "/",
  search: "",
  hash: ""
};
const LocationAdapterFactory = {
  /**
   * Create default window location adapter
   */
  createWindowLocation() {
    if (!isBrowserEnvironment()) {
      return null;
    }
    try {
      return {
        protocol: window.location?.protocol || DEFAULT_LOCATION.protocol,
        host: window.location?.host || DEFAULT_LOCATION.host,
        hostname: window.location?.hostname || DEFAULT_LOCATION.hostname,
        port: window.location?.port || DEFAULT_LOCATION.port,
        pathname: window.location?.pathname || DEFAULT_LOCATION.pathname,
        search: window.location?.search || DEFAULT_LOCATION.search,
        hash: window.location?.hash || DEFAULT_LOCATION.hash
      };
    } catch {
      return DEFAULT_LOCATION;
    }
  }
};
export {
  LocationAdapterFactory
};
