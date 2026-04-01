import { jsx } from "react/jsx-runtime";
import { memo } from "react";
import { TemplateCard } from "./TemplateCard";
const TemplateGrid = memo(function TemplateGrid2({
  items,
  selectedIds,
  type,
  onToggleSelect,
  onCardClick,
  getDifficultyColor,
  emptyMessage = "No items found. Try adjusting your filters.",
  footerText
}) {
  if (items.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-12", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: emptyMessage }) });
  }
  const uniqueItems = items.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: uniqueItems.map((item, index) => {
    const isSelected = selectedIds.has(item.id);
    return /* @__PURE__ */ jsx(
      TemplateCard,
      {
        item,
        isSelected,
        type,
        onToggleSelect,
        onClick: onCardClick,
        getDifficultyColor,
        footerText
      },
      `${item.id}-${index}`
    );
  }) });
});
export {
  TemplateGrid
};
