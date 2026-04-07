import styled, { css, keyframes } from "styled-components";
import { colors as c } from "./designTokens";

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const pulseDot = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
`;

const focusRing = css`
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

const controlBase = css`
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.5rem;
  font: inherit;
  background: ${c.white};
  ${focusRing}

  &:disabled {
    background: ${c.gray100};
  }
`;

export const SettingsPageShell = styled.div`
  height: 100%;
  overflow: auto;
  background: ${c.gray50};
  padding: 2rem;
`;

export const SettingsPageInner = styled.div`
  max-width: 56rem;
  margin: 0 auto;
`;

export const SettingsPageBody = styled.div`
  display: flex;
  gap: 2rem;
`;

export const SettingsMainColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const SettingsHeaderBlock = styled.div`
  margin-bottom: 2rem;
`;

export const SettingsBackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: ${c.gray600};
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray900};
  }
`;

export const SettingsTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

export const SettingsPageTitle = styled.h1`
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: ${c.gray900};
`;

export const SettingsSyncButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s ease;

  ${(p) =>
    p.$enabled
      ? css`
          background: ${c.primary600};
          color: ${c.white};

          &:hover {
            background: ${c.primary700};
          }
        `
      : css`
          background: ${c.gray200};
          color: ${c.gray500};
          cursor: not-allowed;
        `}
`;

export const SettingsLead = styled.p`
  margin: 0;
  color: ${c.gray600};
`;

export const SettingsAccountLine = styled.div`
  margin-top: 1rem;
`;

export const SettingsAccountText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${c.gray500};
`;

export const SettingsTabsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 170px;
`;

export const SettingsTabNavButton = styled.button`
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  font: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  ${(p) =>
    p.$active
      ? css`
          background: ${c.primary600};
          color: ${c.white};
          border-color: ${c.primary600};
        `
      : css`
          background: ${c.white};
          color: ${c.gray600};
          border-color: ${c.gray200};

          &:hover {
            border-color: ${c.primary500};
            color: ${c.primary700};
          }
        `}
`;

export const SettingsSectionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const SettingsMutedStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  ${(p) =>
    p.$readOnly &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

export const SettingsSignInNotice = styled.div`
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${c.amber200};
  background: ${c.amber50};
  color: ${c.amber900};
`;

export const SettingsSignInTitle = styled.p`
  margin: 0;
  font-weight: 600;
  color: ${c.gray900};
`;

export const SettingsSignInBody = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: ${c.gray700};
`;

export const SettingsSignInLink = styled.a`
  display: inline-block;
  margin-top: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.primary600};
  text-decoration: underline;

  &:hover {
    color: ${c.primary700};
  }
`;

export const SettingsCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: ${c.white};
  border-radius: 0.5rem;
  border: 1px solid ${c.gray200};
`;

export const SettingsPanelElevated = styled(SettingsCard)`
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
`;

export const SettingsFieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
`;

export const SettingsIterationInput = styled.input`
  width: 6rem;
  ${controlBase}
`;

export const SettingsSelect = styled.select`
  width: 100%;
  ${controlBase}
`;

export const SettingsHelpText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.gray500};
`;

export const SettingsSuccessText = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${c.green600};
`;

export const AddProviderRevealButton = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px dashed ${c.gray300};
  border-radius: 0.5rem;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: ${c.gray600};
  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: ${c.primary500};
    color: ${c.primary600};
  }
`;

export const AddProviderTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const AddProviderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SettingsLabelBlock = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.5rem;
`;

export const AddProviderButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

export const SettingsButtonPrimary = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.white};
  background: ${c.primary600};

  &:hover {
    background: ${c.primary700};
  }
`;

export const SettingsButtonSecondary = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.gray700};
  background: ${c.gray100};

  &:hover {
    background: ${c.gray200};
  }
`;

export const AutoSyncSection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${c.gray200};
`;

export const AutoSyncRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
`;

export const AutoSyncDot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: ${c.green500};
  animation: ${pulseDot} 2s ease-in-out infinite;
`;

export const AutoSyncText = styled.p`
  margin: 0;
  color: ${c.gray600};
`;

export const AutoSyncSubText = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: ${c.gray500};
`;

export const ProviderPanel = styled(SettingsPanelElevated)`
  gap: 0;
`;

export const ProviderPanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const ProviderTitleCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ProviderEnableCheckbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  color: ${c.primary600};
`;

export const ProviderNameTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${c.gray900};
`;

export const ProviderTypeLine = styled.span`
  display: block;
  font-size: 0.875rem;
  color: ${c.gray500};
  text-transform: capitalize;
`;

export const ProviderToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ProviderIconButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: transparent;
  color: ${c.gray600};
  cursor: pointer;
  line-height: 0;

  &:hover {
    color: ${c.gray700};
  }
`;

export const ProviderDeleteButton = styled(ProviderIconButton)`
  color: ${c.red600};

  &:hover {
    color: ${c.red700};
  }
`;

export const ProviderExpandedStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SettingsTextInput = styled.input`
  width: 100%;
  ${controlBase}
  ${(p) =>
    p.$padRightForIcon &&
    css`
      padding-right: 2.5rem;
    `}
`;

export const ApiKeyFieldWrap = styled.div`
  position: relative;
`;

export const ApiKeyRevealButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem;
  border: none;
  background: transparent;
  color: ${c.gray500};
  cursor: pointer;
  line-height: 0;

  &:hover {
    color: ${c.gray700};
  }

  &:focus {
    outline: none;
  }
`;

export const SettingsInlineRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
`;

export const SettingsSelectFlex = styled(SettingsSelect)`
  flex: 1;
`;

export const SettingsIconActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.gray700};
  background: ${c.gray100};

  &:hover {
    background: ${c.gray200};
  }
`;

export const SettingsTestConnectionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font: inherit;
  cursor: pointer;
  color: ${c.white};
  background: ${c.primary600};

  &:hover:not(:disabled) {
    background: ${c.primary700};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SettingsSpinner = styled.span`
  display: inline-flex;
  animation: ${spin} 1s linear infinite;
`;

export const ProviderTestRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
`;

export const ProviderTestSuccess = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${c.green600};
`;

export const ProviderTestErrorStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const ProviderTestErrorTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${c.red600};
`;

export const ProviderTestErrorDetail = styled.p`
  margin: 0;
  margin-left: 1.75rem;
  font-size: 0.875rem;
  color: ${c.red700};
`;

export const ModelListLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.5rem;
`;

export const ModelListStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const ModelRow = styled.div`
  border-bottom: 1px solid ${c.gray100};

  &:last-child {
    border-bottom: none;
  }
`;

export const ModelRowToggle = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: ${c.gray900};
  text-align: left;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${c.gray700};
  }
`;

export const ModelChevronCell = styled.span`
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${c.gray600};
  font-weight: 700;
`;

export const ModelNameText = styled.span`
  font-weight: 500;
`;

export const ModelDefaultTag = styled.span`
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: ${c.primary100};
  color: ${c.primary700};
`;

export const ModelExpandPanel = styled.div`
  margin: 0.5rem 0 0.5rem 1.5rem;
  padding-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ModelCompactLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${c.gray700};
  margin-bottom: 0.25rem;
`;

export const ModelNameInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  border: 1px solid ${c.gray300};
  border-radius: 0.25rem;
  font: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${c.primary500};
  }
`;

export const ModelActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ModelDefaultPillButton = styled.button`
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s ease;

  ${(p) =>
    p.$active
      ? css`
          background: ${c.primary600};
          color: ${c.white};
        `
      : css`
          background: ${c.gray200};
          color: ${c.gray700};

          &:hover {
            background: ${c.gray300};
          }
        `}
`;

export const ModelRemoveButton = styled.button`
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font: inherit;
  cursor: pointer;
  color: ${c.red700};
  background: ${c.red100};

  &:hover {
    background: ${c.red200};
  }
`;
