import { jsx, jsxs } from "react/jsx-runtime";
function AutoSyncIndicator() {
  return /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-6 border-t border-gray-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
      /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
        /* @__PURE__ */ jsx("strong", { children: "Auto-sync enabled:" }),
        " Settings are automatically saved when you make changes."
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-gray-500", children: "Settings are automatically synced to the backend server when you make changes." })
  ] });
}
export {
  AutoSyncIndicator
};
