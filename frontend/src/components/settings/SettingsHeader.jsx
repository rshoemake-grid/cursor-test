import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  SettingsHeaderBlock,
  SettingsBackButton,
  SettingsTitleRow,
  SettingsPageTitle,
  SettingsSyncButton,
  SettingsLead,
  SettingsAccountLine,
  SettingsAccountText,
} from "../../styles/settings.styled";
function SettingsHeader({ onSyncClick }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canSync = isAuthenticated;
  return (
    <SettingsHeaderBlock>
      <SettingsBackButton type="button" onClick={() => navigate("/")}>
        <ArrowLeft size={20} aria-hidden />
        <span>Back to Main</span>
      </SettingsBackButton>
      <SettingsTitleRow>
        <SettingsPageTitle>Settings</SettingsPageTitle>
        <SettingsSyncButton
          type="button"
          onClick={() => {
            if (canSync) {
              onSyncClick();
            }
          }}
          disabled={!canSync}
          title={
            canSync ? "Save settings to the server" : "Sign in to sync settings"
          }
          $enabled={canSync === true}
        >
          <Save size={16} aria-hidden />
          Sync Now
        </SettingsSyncButton>
      </SettingsTitleRow>
      <SettingsLead>
        Configure LLM providers and workflow generation limits
      </SettingsLead>
      <SettingsAccountLine>
        <SettingsAccountText>
          {isAuthenticated
            ? `Signed in as ${user?.username || user?.email || "your account"}`
            : "Login to sync your LLM providers across devices."}
        </SettingsAccountText>
      </SettingsAccountLine>
    </SettingsHeaderBlock>
  );
}
export { SettingsHeader };
