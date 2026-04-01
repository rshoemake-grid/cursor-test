import { jsx } from "react/jsx-runtime";
function SettingsTabButton({
  label,
  isActive,
  onClick
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick,
      className: `text-left px-4 py-3 rounded-lg border transition ${isActive ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-700"}`,
      children: label
    }
  );
}
export {
  SettingsTabButton
};
