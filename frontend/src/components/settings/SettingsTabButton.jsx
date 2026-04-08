import PropTypes from "prop-types";
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

SettingsTabButton.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export { SettingsTabButton };
