import styled from "styled-components";
import { colors as c } from "./designTokens";

export const WorkflowTabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const WorkflowBuilderMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const WorkflowCanvasHost = styled.div`
  flex: 1;
  position: relative;
`;

export const WorkflowCanvasAbsolute = styled.div`
  position: absolute;
  inset: 0;
`;

export const WorkflowLayoutRow = styled.div.attrs(() => ({
  "data-testid": "workflow-builder-layout-row",
}))`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export const WorkflowLayoutCenter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const WorkflowEmptyMain = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${c.gray50};
`;

export const ContextMenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
`;

export const Icon16 = styled.span`
  display: inline-flex;
  align-items: center;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;
