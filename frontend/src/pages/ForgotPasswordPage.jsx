import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API_CONFIG } from "../config/constants";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { defaultAdapters } from "../types/adapters";
function ForgotPasswordPage({
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL
} = {}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await httpClient.post(
        `${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD}`,
        { email },
        { "Content-Type": "application/json" }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(extractApiErrorMessage(errorData, "Failed to send reset email"));
      }
      const data = await response.json();
      setSuccess(true);
      const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
      if (isDev && data.token) {
        setResetToken(data.token);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to send reset email"));
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Check Your Email" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "If an account with that email exists, we've sent password reset instructions." }),
        resetToken && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-800 font-semibold mb-2", children: "Development Mode:" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-700 mb-2", children: "Reset Token:" }),
          /* @__PURE__ */ jsx("code", { className: "text-xs bg-white p-2 rounded block break-all", children: resetToken }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate(`/reset-password?token=${resetToken}`),
              className: "mt-3 text-sm text-blue-600 hover:text-blue-700 underline",
              children: "Click here to reset password"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => navigate("/auth"),
          className: "w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors",
          children: "Back to Login"
        }
      ) })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => navigate("/auth"),
        className: "flex items-center gap-2 text-gray-600 hover:text-gray-700 mb-6",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
          "Back to Login"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Forgot Password?" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Enter your email address and we'll send you a link to reset your password." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            autoFocus: true,
            onKeyDown: (e) => {
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                handleSubmit(e);
              }
            },
            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            placeholder: "your@email.com"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          children: loading ? "Sending..." : "Send Reset Link"
        }
      )
    ] })
  ] }) });
}
export {
  ForgotPasswordPage as default
};
