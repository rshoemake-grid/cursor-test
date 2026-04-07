import { memo } from "react";
import { Clock, Heart, TrendingUp } from "lucide-react";
import {
  TemplateCardRoot,
  TemplateCardBody,
  TemplateCardTopRow,
  TemplateCardTitleRow,
  TemplateCardCheckbox,
  TemplateCardTitle,
  TemplateCardBadgeGroup,
  TemplateCardPillBlue,
  TemplateCardDescription,
  TemplateCardTags,
  TemplateCardTag,
  TemplateCardMetaRow,
  TemplateCardMetaItem,
  TemplateCardAuthor,
  TemplateCardAuthorLabel,
  TemplateDifficultyBadge,
  TemplateCardFooter,
  TemplateCardFooterHint,
} from "../styles/templateCard.styled";
const TemplateCard = memo(function TemplateCard2({
  item,
  isSelected,
  type,
  onToggleSelect,
  onClick,
  footerText,
}) {
  const isAgent = type === "agent";
  const isTool = type === "tool";
  const agent = isAgent ? item : null;
  const tool = isTool ? item : null;
  const template = !isAgent && !isTool ? item : null;
  return (
    <TemplateCardRoot
      $selected={isSelected}
      data-selected={isSelected}
      onClick={(e) => onClick(e, item.id)}
    >
      <TemplateCardBody>
        <TemplateCardTopRow>
          <TemplateCardTitleRow>
            <TemplateCardCheckbox
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${item.name || item.label || "item"}`}
            />
            <TemplateCardTitle>
              {isAgent
                ? agent?.name || agent?.label
                : isTool
                  ? tool?.name || tool?.label
                  : template?.name}
            </TemplateCardTitle>
          </TemplateCardTitleRow>
          <TemplateCardBadgeGroup>
            {item.is_official && (
              <TemplateCardPillBlue>Official</TemplateCardPillBlue>
            )}
          </TemplateCardBadgeGroup>
        </TemplateCardTopRow>
        <TemplateCardDescription>{item.description}</TemplateCardDescription>
        {item.tags && item.tags.length > 0 && (
          <TemplateCardTags>
            {item.tags.map((tag, idx) => (
              <TemplateCardTag key={idx}>{tag}</TemplateCardTag>
            ))}
          </TemplateCardTags>
        )}
        <TemplateCardMetaRow>
          {isAgent || isTool ? (
            <>
              <TemplateCardMetaItem>
                <Clock size={16} aria-hidden />
                <span>{(agent || tool)?.estimated_time || "N/A"}</span>
              </TemplateCardMetaItem>
              {(agent || tool)?.category && (
                <TemplateCardPillBlue>
                  {((agent || tool)?.category ?? "")
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </TemplateCardPillBlue>
              )}
            </>
          ) : (
            <>
              <TemplateCardMetaItem>
                <TrendingUp size={16} aria-hidden />
                <span>{template?.uses_count || 0}</span>
              </TemplateCardMetaItem>
              <TemplateCardMetaItem>
                <Heart size={16} aria-hidden />
                <span>{template?.likes_count || 0}</span>
              </TemplateCardMetaItem>
              <TemplateCardMetaItem>
                <Clock size={16} aria-hidden />
                <span>{template?.estimated_time || "N/A"}</span>
              </TemplateCardMetaItem>
            </>
          )}
          {item.author_name && (
            <TemplateCardAuthor>
              <TemplateCardAuthorLabel>By:</TemplateCardAuthorLabel>
              <span>{item.author_name}</span>
            </TemplateCardAuthor>
          )}
        </TemplateCardMetaRow>
        <TemplateDifficultyBadge $difficulty={item.difficulty || "beginner"}>
          {item.difficulty || "beginner"}
        </TemplateDifficultyBadge>
      </TemplateCardBody>
      <TemplateCardFooter>
        <TemplateCardFooterHint $selected={isSelected}>
          {footerText ||
            (isSelected
              ? "Selected - Click to use"
              : "Click card or checkbox to select")}
        </TemplateCardFooterHint>
      </TemplateCardFooter>
    </TemplateCardRoot>
  );
});
export { TemplateCard };
