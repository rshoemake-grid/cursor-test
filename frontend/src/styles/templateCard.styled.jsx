import styled from "styled-components";
import { colors as c } from "./designTokens";
import { getDifficultyBadgeTheme } from "../utils/difficultyColors";

export const TemplateGridLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const TemplateCardRoot = styled.div.attrs({
  "data-marketplace-card": "true",
})`
  overflow: hidden;
  cursor: pointer;
  background: ${c.white};
  border-radius: 0.5rem;
  border: 2px solid
    ${(p) => (p.$selected ? c.primary500 : "transparent")};
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1),
    ${(p) => (p.$selected ? `0 0 0 2px ${c.primary200}` : "none")};
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1),
      ${(p) => (p.$selected ? `0 0 0 2px ${c.primary200}` : "none")};
  }
`;

export const TemplateCardBody = styled.div`
  padding: 1.5rem;
`;

export const TemplateCardTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const TemplateCardTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
`;

export const TemplateCardCheckbox = styled.input`
  margin-top: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  cursor: pointer;
  color: ${c.primary600};
  border-color: ${c.gray300};
  border-radius: 0.25rem;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

export const TemplateCardTitle = styled.h3`
  margin: 0;
  flex: 1;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const TemplateCardBadgeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const TemplateCardPillBlue = styled.span`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.blue800};
  background: ${c.blue100};
  border-radius: 0.25rem;
`;

export const TemplateCardDescription = styled.p`
  margin: 0 0 1rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: ${c.gray600};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const TemplateCardTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const TemplateCardTag = styled.span`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: ${c.gray700};
  background: ${c.gray100};
  border-radius: 0.25rem;
`;

export const TemplateCardMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: ${c.gray500};
`;

export const TemplateCardMetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const TemplateCardAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${c.gray600};
`;

export const TemplateCardAuthorLabel = styled.span`
  font-weight: 500;
`;

export const TemplateDifficultyBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(p) => getDifficultyBadgeTheme(p.$difficulty).background};
  color: ${(p) => getDifficultyBadgeTheme(p.$difficulty).color};
`;

export const TemplateCardFooter = styled.div`
  padding: 1rem 1.5rem;
  background: ${c.gray50};
  border-top: 1px solid ${c.gray200};
`;

export const TemplateCardFooterHint = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
  color: ${(p) => (p.$selected ? c.primary700 : c.gray500)};
  background: ${(p) => (p.$selected ? c.primary100 : "transparent")};
  font-weight: ${(p) => (p.$selected ? 500 : 400)};
`;
