import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
function AdvancedSearch({
  value,
  onSearch,
  onClear,
  placeholder = "Search executions...",
  showAdvanced = false,
  onToggleAdvanced
}) {
  const [searchQuery, setSearchQuery] = useState(value);
  const handleChange = (e) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onSearch(newValue);
  };
  const handleClear = () => {
    setSearchQuery("");
    onClear();
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: searchQuery,
          onChange: handleChange,
          placeholder,
          className: "w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        }
      ),
      searchQuery && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleClear,
          className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600",
          "aria-label": "Clear search",
          children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
        }
      )
    ] }),
    onToggleAdvanced && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onToggleAdvanced,
        className: `mt-2 flex items-center gap-2 text-sm ${showAdvanced ? "text-primary-600" : "text-gray-600"} hover:text-primary-600 transition-colors`,
        children: [
          /* @__PURE__ */ jsx(Filter, { className: "w-4 h-4" }),
          showAdvanced ? "Hide" : "Show",
          " Advanced Filters"
        ]
      }
    )
  ] });
}
export {
  AdvancedSearch as default
};
