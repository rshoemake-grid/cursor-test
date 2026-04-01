import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { Clock, Heart, TrendingUp } from "lucide-react";
const TemplateCard = memo(function TemplateCard2({
  item,
  isSelected,
  type,
  onToggleSelect,
  onClick,
  getDifficultyColor,
  footerText
}) {
  const isAgent = type === "agent";
  const isTool = type === "tool";
  const agent = isAgent ? item : null;
  const tool = isTool ? item : null;
  const template = !isAgent && !isTool ? item : null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick: (e) => onClick(e, item.id),
      className: `bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer border-2 ${isSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-transparent"}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 flex-1", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: isSelected,
                  onChange: (e) => {
                    e.stopPropagation();
                    onToggleSelect(item.id);
                  },
                  className: "mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer",
                  onClick: (e) => e.stopPropagation()
                }
              ),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-900 flex-1", children: isAgent ? agent?.name || agent?.label : isTool ? tool?.name || tool?.label : template?.name })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: item.is_official && /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded", children: "Official" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mb-4 line-clamp-2", children: item.description }),
          item.tags && item.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: item.tags.map((tag, idx) => /* @__PURE__ */ jsx(
            "span",
            {
              className: "px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded",
              children: tag
            },
            idx
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-500 mb-4", children: [
            isAgent || isTool ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: (agent || tool)?.estimated_time || "N/A" })
              ] }),
              (agent || tool)?.category && /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded", children: ((agent || tool)?.category ?? "").split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: template?.uses_count || 0 })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: template?.likes_count || 0 })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { children: template?.estimated_time || "N/A" })
              ] })
            ] }),
            item.author_name && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-gray-600", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "By:" }),
              /* @__PURE__ */ jsx("span", { children: item.author_name })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                item.difficulty || "beginner"
              )}`,
              children: item.difficulty || "beginner"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-6 py-4 bg-gray-50 border-t border-gray-200", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: `text-sm text-center py-2 px-4 rounded-lg ${isSelected ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-500"}`,
            children: footerText || (isSelected ? "Selected - Click to use" : "Click card or checkbox to select")
          }
        ) })
      ]
    }
  );
});
export {
  TemplateCard
};
