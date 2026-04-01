import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { API_CONFIG } from "../config/constants";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
import { defaultAdapters } from "../types/adapters";
function ResetPasswordPage({
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = API_CONFIG.BASE_URL
} = {}) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
    }
  }, [token]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Reset token is missing");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const response = await httpClient.post(
        `${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD}`,
        { token, new_password: password },
        { "Content-Type": "application/json" }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(extractApiErrorMessage(errorData, "Failed to reset password"));
      }
      setSuccess(true);
      setTimeout(() => {
        navigate("/auth");
      }, 2e3);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100", children: /* @__PURE__ */ jsx("div", { className: "bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md", children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Password Reset Successful!" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Your password has been reset. Redirecting to login..." })
    ] }) }) });
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
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Reset Password" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Enter your new password below." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "New Password" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: showPassword ? "text" : "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true,
              minLength: 6,
              autoFocus: true,
              className: "w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowPassword(!showPassword),
              className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none",
              tabIndex: -1,
              children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Confirm New Password" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: showConfirmPassword ? "text" : "password",
              value: confirmPassword,
              onChange: (e) => setConfirmPassword(e.target.value),
              required: true,
              minLength: 6,
              onKeyDown: (e) => {
                if (e.key === "Enter" && !loading && token) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              },
              className: "w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowConfirmPassword(!showConfirmPassword),
              className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none",
              tabIndex: -1,
              children: showConfirmPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-5 h-5" }) : /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading || !token,
          className: "w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          children: loading ? "Resetting..." : "Reset Password"
        }
      )
    ] })
  ] }) });
}
export {
  ResetPasswordPage as default
};
