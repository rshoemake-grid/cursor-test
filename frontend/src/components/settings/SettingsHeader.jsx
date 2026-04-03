import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
function SettingsHeader({ onSyncClick }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canSync = isAuthenticated;
  return (
    <div className="mb-8">
      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Main</span>
      </button>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <button
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
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${canSync === true ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
        >
          <Save className="w-4 h-4" />
          Sync Now
        </button>
      </div>
      <p className="text-gray-600">
        Configure LLM providers and workflow generation limits
      </p>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          {isAuthenticated
            ? `Signed in as ${user?.username || user?.email || "your account"}`
            : "Login to sync your LLM providers across devices."}
        </p>
      </div>
    </div>
  );
}
export { SettingsHeader };
