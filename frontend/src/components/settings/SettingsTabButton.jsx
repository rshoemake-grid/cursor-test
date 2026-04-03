function SettingsTabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-4 py-3 rounded-lg border transition ${isActive ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700"}`}
    >
      {label}
    </button>
  );
}
export { SettingsTabButton };
