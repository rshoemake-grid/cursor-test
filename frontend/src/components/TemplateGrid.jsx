import { memo } from "react";
import { TemplateCard } from "./TemplateCard";
import {
  EmptyStateCentered,
  EmptyStateParagraph,
} from "../styles/contentBlocks.styled";
import { TemplateGridLayout } from "../styles/templateCard.styled";
const TemplateGrid = memo(function TemplateGrid2({
  items,
  selectedIds,
  type,
  onToggleSelect,
  onCardClick,
  emptyMessage = "No items found. Try adjusting your filters.",
  footerText,
}) {
  if (items.length === 0) {
    return (
      <EmptyStateCentered>
        <EmptyStateParagraph>{emptyMessage}</EmptyStateParagraph>
      </EmptyStateCentered>
    );
  }
  const uniqueItems = items.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id),
  );
  return (
    <TemplateGridLayout data-testid="template-grid-layout">
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
            footerText={footerText}
          />
        );
      })}
    </TemplateGridLayout>
  );
});
export { TemplateGrid };
