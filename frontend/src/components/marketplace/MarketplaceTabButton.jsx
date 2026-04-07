import { MpTabButton, MpTabIconWrap } from "../../styles/marketplaceComponents.styled";

function resolveIconSize(iconSize) {
  if (!iconSize) {
    return "md";
  }
  return iconSize.includes("w-4") ? "sm" : "md";
}

function MarketplaceTabButton({
  label,
  icon: Icon,
  isActive,
  onClick,
  iconSize = "w-5 h-5",
}) {
  const size = resolveIconSize(iconSize);
  return (
    <MpTabButton $active={isActive} onClick={onClick}>
      <MpTabIconWrap $size={size}>
        <Icon aria-hidden />
      </MpTabIconWrap>
      {label}
    </MpTabButton>
  );
}
export { MarketplaceTabButton };
