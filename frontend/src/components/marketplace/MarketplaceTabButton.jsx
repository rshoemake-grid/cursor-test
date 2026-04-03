function MarketplaceTabButton({
  label,
  icon: Icon,
  isActive,
  onClick,
  iconSize = "w-5 h-5",
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${isActive ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-600 hover:text-gray-900"}`}
    >
      <Icon className={iconSize} />
      {label}
    </button>
  );
}
export { MarketplaceTabButton };
