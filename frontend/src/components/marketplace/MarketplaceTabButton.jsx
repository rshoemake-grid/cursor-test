import { jsx, jsxs } from "react/jsx-runtime";
function MarketplaceTabButton({
  label,
  icon: Icon,
  isActive,
  onClick,
  iconSize = "w-5 h-5"
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick,
      className: `px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${isActive ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-600 hover:text-gray-900"}`,
      children: [
        /* @__PURE__ */ jsx(Icon, { className: iconSize }),
        label
      ]
    }
  );
}
export {
  MarketplaceTabButton
};
