import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Download, Trash2 } from "lucide-react";
function MarketplaceActionButtons({
  selectedCount,
  hasOfficial,
  onLoad,
  onDelete,
  onUse,
  type,
  showDelete = true
}) {
  if (selectedCount === 0) {
    return null;
  }
  const typeLabel = type === "workflow" ? "Workflow" : type === "tool" ? "Tool" : "Agent";
  const typeLabelPlural = type === "workflow" ? "Workflows" : type === "tool" ? "Tools" : "Agents";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    onLoad && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onLoad,
        className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2",
        children: [
          /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
          "Load ",
          selectedCount,
          " ",
          typeLabel,
          selectedCount > 1 ? "s" : ""
        ]
      }
    ),
    onUse && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onUse,
        className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2",
        children: [
          /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
          "Use ",
          selectedCount,
          " ",
          typeLabel,
          selectedCount > 1 ? "s" : ""
        ]
      }
    ),
    showDelete && !hasOfficial && onDelete && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onDelete,
        className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2",
        children: [
          /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
          "Delete ",
          selectedCount,
          " ",
          typeLabelPlural
        ]
      }
    )
  ] });
}
export {
  MarketplaceActionButtons
};
