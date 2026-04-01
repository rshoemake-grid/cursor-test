import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
function SettingsHeader({ onSyncClick }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canSync = isAuthenticated;
  return /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => navigate("/"),
        className: "mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors",
        children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { children: "Back to Main" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Settings" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => {
            if (canSync) {
              onSyncClick();
            }
          },
          disabled: !canSync,
          title: canSync ? "Save settings to the server" : "Sign in to sync settings",
          className: `px-4 py-2 rounded-lg flex items-center gap-2 ${canSync === true ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`,
          children: [
            /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
            "Sync Now"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Configure LLM providers and workflow generation limits" }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: isAuthenticated ? `Signed in as ${user?.username || user?.email || "your account"}` : "Login to sync your LLM providers across devices." }) })
  ] });
}
export {
  SettingsHeader
};
