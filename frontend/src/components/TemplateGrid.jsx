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
  footerText,
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }
  const uniqueItems = items.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id),
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uniqueItems.map((item, index) => {
        const isSelected = selectedIds.has(item.id);
        return (
          <TemplateCard
            key={`${item.id}-${index}`}
            item={item}
            isSelected={isSelected}
            type={type}
            onToggleSelect={onToggleSelect}
            onClick={onCardClick}
            getDifficultyColor={getDifficultyColor}
            footerText={footerText}
          />
        );
      })}
    </div>
  );
});
export { TemplateGrid };
