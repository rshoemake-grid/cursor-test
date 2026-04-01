var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { logger } from "../utils/logger";
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "handleReset", () => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    });
    __publicField(this, "handleGoHome", () => {
      window.location.href = "/";
    });
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    this.props.onError?.(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-8 h-8 text-red-500" }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Something went wrong" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-6", children: "We're sorry, but something unexpected happened. Please try refreshing the page or returning to the home page." }),
        this.state.error && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-red-800 mb-2", children: "Error Details:" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-red-700 font-mono", children: this.state.error.toString() }),
          process.env.NODE_ENV === "development" && this.state.errorInfo && /* @__PURE__ */ jsxs("details", { className: "mt-4", children: [
            /* @__PURE__ */ jsx("summary", { className: "text-sm text-red-700 cursor-pointer", children: "Stack Trace" }),
            /* @__PURE__ */ jsx("pre", { className: "mt-2 text-xs text-red-600 overflow-auto", children: this.state.errorInfo.componentStack })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: this.handleReset,
              className: "flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                "Try Again"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: this.handleGoHome,
              className: "flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Home, { className: "w-4 h-4" }),
                "Go Home"
              ]
            }
          )
        ] })
      ] }) });
    }
    return this.props.children;
  }
}
export {
  ErrorBoundary as default
};
