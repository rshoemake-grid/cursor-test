import {
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { showError } from "../../utils/notifications";
import {
  ProviderPanel,
  ProviderPanelHeader,
  ProviderTitleCluster,
  ProviderEnableCheckbox,
  ProviderNameTitle,
  ProviderTypeLine,
  ProviderToolbar,
  ProviderIconButton,
  ProviderDeleteButton,
  ProviderExpandedStack,
  SettingsLabelBlock,
  ApiKeyFieldWrap,
  SettingsTextInput,
  ApiKeyRevealButton,
  SettingsInlineRow,
  SettingsSelectFlex,
  SettingsIconActionButton,
  SettingsTestConnectionButton,
  SettingsSpinner,
  ProviderTestRow,
  ProviderTestSuccess,
  ProviderTestErrorStack,
  ProviderTestErrorTitle,
  ProviderTestErrorDetail,
  ModelListLabel,
  ModelListStack,
  ModelRow,
  ModelRowToggle,
  ModelChevronCell,
  ModelNameText,
  ModelDefaultTag,
  ModelExpandPanel,
  ModelCompactLabel,
  ModelNameInput,
  ModelActionRow,
  ModelDefaultPillButton,
  ModelRemoveButton,
} from "../../styles/settings.styled";
function ProviderForm({
  provider,
  showApiKeys,
  expandedProviders,
  expandedModels,
  testingProvider,
  testResults,
  onToggleProviderModels,
  onToggleApiKeyVisibility,
  onUpdateProvider,
  onDeleteProvider,
  onAddCustomModel,
  onTestProvider,
  onToggleModel,
  isModelExpanded,
}) {
  const isExpanded = expandedProviders[provider.id] || false;
  const isTesting = testingProvider === provider.id;
  const testResult = testResults[provider.id];
  return (
    <ProviderPanel>
      <ProviderPanelHeader>
        <ProviderTitleCluster>
          <ProviderEnableCheckbox
            type="checkbox"
            checked={provider.enabled}
            onChange={(e) =>
              onUpdateProvider(provider.id, {
                enabled: e.target.checked,
              })
            }
          />
          <div>
            <ProviderNameTitle>{provider.name}</ProviderNameTitle>
            <ProviderTypeLine>{provider.type}</ProviderTypeLine>
          </div>
        </ProviderTitleCluster>
        <ProviderToolbar>
          <ProviderIconButton
            type="button"
            onClick={() => onToggleProviderModels(provider.id)}
            title={isExpanded ? "Collapse models" : "Expand models"}
          >
            {isExpanded ? (
              <ChevronDown size={20} aria-hidden />
            ) : (
              <ChevronRight size={20} aria-hidden />
            )}
          </ProviderIconButton>
          <ProviderDeleteButton
            type="button"
            onClick={() => onDeleteProvider(provider.id)}
            title="Delete provider"
          >
            <Trash2 size={20} aria-hidden />
          </ProviderDeleteButton>
        </ProviderToolbar>
      </ProviderPanelHeader>
      {isExpanded && (
        <ProviderExpandedStack>
          <div>
            <SettingsLabelBlock>API Key</SettingsLabelBlock>
            <ApiKeyFieldWrap>
              <SettingsTextInput
                type={showApiKeys[provider.id] ? "text" : "password"}
                value={provider.apiKey || ""}
                onChange={(e) =>
                  onUpdateProvider(provider.id, {
                    apiKey: e.target.value,
                  })
                }
                placeholder="sk-..."
                $padRightForIcon
              />
              <ApiKeyRevealButton
                type="button"
                onClick={() => onToggleApiKeyVisibility(provider.id)}
                title={
                  showApiKeys[provider.id] ? "Hide API key" : "Show API key"
                }
              >
                {showApiKeys[provider.id] ? (
                  <EyeOff size={20} aria-hidden />
                ) : (
                  <Eye size={20} aria-hidden />
                )}
              </ApiKeyRevealButton>
            </ApiKeyFieldWrap>
          </div>
          <div>
            <SettingsLabelBlock>Base URL</SettingsLabelBlock>
            <SettingsTextInput
              type="text"
              value={provider.baseUrl || ""}
              onChange={(e) =>
                onUpdateProvider(provider.id, {
                  baseUrl: e.target.value,
                })
              }
              placeholder="https://api.example.com/v1"
            />
          </div>
          <div>
            <SettingsLabelBlock>Default Model</SettingsLabelBlock>
            <SettingsInlineRow>
              <SettingsSelectFlex
                value={provider.defaultModel || ""}
                onChange={(e) =>
                  onUpdateProvider(provider.id, {
                    defaultModel: e.target.value,
                  })
                }
              >
                {(provider.models || []).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </SettingsSelectFlex>
              <SettingsIconActionButton
                type="button"
                onClick={() => onAddCustomModel(provider.id)}
                title="Add custom model"
              >
                <Plus size={16} aria-hidden />
              </SettingsIconActionButton>
            </SettingsInlineRow>
          </div>
          <ModelList
            provider={provider}
            expandedModels={expandedModels}
            onUpdateProvider={onUpdateProvider}
            onToggleModel={onToggleModel}
            isModelExpanded={isModelExpanded}
          />
          <ProviderTestRow>
            <SettingsTestConnectionButton
              type="button"
              onClick={() => onTestProvider(provider)}
              disabled={!provider.apiKey || isTesting}
            >
              {isTesting ? (
                <>
                  <SettingsSpinner>
                    <Loader size={16} aria-hidden />
                  </SettingsSpinner>
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </SettingsTestConnectionButton>
            {testResult?.status === "success" && (
              <ProviderTestSuccess>
                <CheckCircle size={20} aria-hidden />
                <span>{testResult.message}</span>
              </ProviderTestSuccess>
            )}
            {testResult?.status === "error" && (
              <ProviderTestErrorStack>
                <ProviderTestErrorTitle>
                  <XCircle size={20} aria-hidden />
                  <strong>Connection failed</strong>
                </ProviderTestErrorTitle>
                <ProviderTestErrorDetail>
                  {testResult.message}
                </ProviderTestErrorDetail>
              </ProviderTestErrorStack>
            )}
          </ProviderTestRow>
        </ProviderExpandedStack>
      )}
    </ProviderPanel>
  );
}
function ModelList({
  provider,
  onUpdateProvider,
  onToggleModel,
  isModelExpanded,
  expandedModels: _expandedModels,
}) {
  const handleDeleteModel = (model) => {
    if ((provider.models || []).length > 1) {
      const newModels = (provider.models || []).filter((m) => m !== model);
      const newDefaultModel =
        provider.defaultModel === model
          ? newModels[0] || ""
          : provider.defaultModel;
      onUpdateProvider(provider.id, {
        models: newModels,
        defaultModel: newDefaultModel,
      });
      if (isModelExpanded(provider.id, model)) {
        onToggleModel(provider.id, model);
      }
    }
  };
  return (
    <div>
      <ModelListLabel>Models</ModelListLabel>
      <ModelListStack>
        {(provider.models || []).map((model, index) => {
          const modelKey = `${provider.id}-${model}-${index}`;
          const expanded = isModelExpanded(provider.id, model);
          return (
            <ModelRow key={modelKey}>
              <ModelRowToggle
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleModel(provider.id, model);
                }}
              >
                <ModelChevronCell>
                  {expanded ? (
                    <ChevronDown size={16} strokeWidth={2.5} aria-hidden />
                  ) : (
                    <ChevronRight size={16} strokeWidth={2.5} aria-hidden />
                  )}
                </ModelChevronCell>
                <ModelNameText>{model}</ModelNameText>
                {model === provider.defaultModel && (
                  <ModelDefaultTag>Default</ModelDefaultTag>
                )}
              </ModelRowToggle>
              {expanded && (
                <ModelExpandPanel>
                  <div>
                    <ModelCompactLabel>Model Name</ModelCompactLabel>
                    <ModelNameInput
                      type="text"
                      value={model}
                      onChange={(e) => {
                        const newModels = (provider.models || []).map((m) =>
                          m === model ? e.target.value : m,
                        );
                        const newDefaultModel =
                          provider.defaultModel === model
                            ? e.target.value
                            : provider.defaultModel;
                        onUpdateProvider(provider.id, {
                          models: newModels,
                          defaultModel: newDefaultModel,
                        });
                      }}
                    />
                  </div>
                  <ModelActionRow>
                    <ModelDefaultPillButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (provider.defaultModel !== model) {
                          onUpdateProvider(provider.id, {
                            defaultModel: model,
                          });
                        }
                      }}
                      $active={model === provider.defaultModel}
                    >
                      {model === provider.defaultModel
                        ? "Default Model"
                        : "Set as Default"}
                    </ModelDefaultPillButton>
                    <ModelRemoveButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if ((provider.models || []).length > 1) {
                          handleDeleteModel(model);
                        } else {
                          showError(
                            "Cannot delete the last model. Add another model first.",
                          );
                        }
                      }}
                    >
                      Remove
                    </ModelRemoveButton>
                  </ModelActionRow>
                </ModelExpandPanel>
              )}
            </ModelRow>
          );
        })}
      </ModelListStack>
    </div>
  );
}
export { ProviderForm };
