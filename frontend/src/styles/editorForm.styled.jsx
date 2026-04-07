import styled, { css } from "styled-components";
import { colors as c } from "./designTokens";

const focusRing = css`
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

const controlLg = css`
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  background: ${c.white};
  ${focusRing}
`;

/** Top border + padding for node editor sections */
export const EditorSectionRoot = styled.div`
  border-top: 1px solid ${c.gray200};
  padding-top: 1rem;
`;

export const EditorSectionTitle = styled.h4`
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${c.gray900};
`;

/** Vertical rhythm between fields: $mt sm=0.75rem, md=1rem; $mb sm/md same */
export const EditorFieldGroup = styled.div`
  margin-top: ${(p) =>
    p.$mt === "sm" ? "0.75rem" : p.$mt === "md" ? "1rem" : "0"};
  margin-bottom: ${(p) =>
    p.$mb === "sm" ? "0.75rem" : p.$mb === "md" ? "1rem" : "0"};
`;

export const EditorLabel = styled.label`
  display: block;
  font-size: ${(p) => (p.$compact ? "0.75rem" : "0.875rem")};
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.25rem;
`;

export const EditorSelect = styled.select`
  ${controlLg}
`;

export const EditorInput = styled.input`
  ${controlLg}
`;

export const EditorInputCompact = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.25rem;
  font: inherit;
  background: ${c.white};
  ${focusRing}
`;

export const EditorTextarea = styled.textarea`
  ${controlLg}
  resize: vertical;
  ${(p) =>
    p.$mono === "xs" &&
    css`
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        monospace;
      font-size: 0.75rem;
    `}
  ${(p) =>
    p.$mono === "sm" &&
    css`
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        monospace;
      font-size: 0.875rem;
    `}
`;

export const EditorHint = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const EditorMutedParagraph = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const EditorInlineCode = styled.code`
  font-size: 0.75rem;
`;

export const EditorInsetPanel = styled.div`
  margin-bottom: ${(p) => (p.$flushBottom ? "0" : "1rem")};
  padding: 0.75rem;
  background: ${c.gray50};
  border: 1px solid ${c.gray200};
  border-radius: 0.5rem;
`;

export const EditorCalloutBlue = styled.div`
  margin-top: ${(p) =>
    p.$mt === "sm" ? "0.75rem" : p.$mt === "md" ? "1rem" : "0"};
  margin-bottom: ${(p) =>
    p.$mb === "md" ? "1rem" : p.$mb === "sm" ? "0.75rem" : "0"};
  padding: 0.75rem;
  background: ${c.blue50};
  border: 1px solid ${c.blue200};
  border-radius: 0.5rem;
`;

export const EditorCalloutBlueHeading = styled.h5`
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${c.blue900};
`;

export const EditorCalloutBlueTitle = styled.p`
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${c.blue900};
`;

export const EditorCalloutBlueBody = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.blue700};
`;

export const EditorCalloutAmber = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: ${c.amber50};
  border: 1px solid ${c.amber200};
  border-radius: 0.5rem;
`;

export const EditorCalloutAmberTitle = styled.p`
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${c.amber900};
`;

export const EditorCalloutAmberBody = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.amber700};
`;

export const EditorSubsectionDivider = styled.div`
  border-top: 1px solid ${c.gray200};
  padding-top: 0.75rem;
  margin-top: 0.75rem;
`;

export const EditorSubsectionDividerTitle = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${c.gray700};
`;

export const EditorRangeInput = styled.input`
  width: 100%;
`;

export const EditorRangeScaleRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const EditorSecondaryFullButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: ${c.gray700};
  background: ${c.white};
  font: inherit;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${c.gray50};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

export const EditorCheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const EditorCheckbox = styled.input`
  width: 1rem;
  height: 1rem;
`;

export const EditorCheckboxCaption = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
`;
