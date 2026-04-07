import { SettingsTabNavButton } from "../../styles/settings.styled";
function SettingsTabButton({ label, isActive, onClick }) {
  return (
    <SettingsTabNavButton
      type="button"
      onClick={onClick}
      $active={isActive}
      aria-pressed={isActive}
    >
      {label}
    </SettingsTabNavButton>
  );
}
export { SettingsTabButton };
