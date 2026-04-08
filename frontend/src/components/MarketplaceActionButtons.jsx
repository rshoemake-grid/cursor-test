import PropTypes from "prop-types";
import { Download, Trash2 } from "lucide-react";
import {
  MpActionBtnPrimary,
  MpActionBtnDanger,
} from "../styles/marketplaceComponents.styled";

function MarketplaceActionButtons({
  selectedCount,
  hasOfficial,
  onLoad,
  onDelete,
  onUse,
  type,
  showDelete = true,
}) {
  if (selectedCount === 0) {
    return null;
  }
  const typeLabel =
    type === "workflow" ? "Workflow" : type === "tool" ? "Tool" : "Agent";
  const typeLabelPlural =
    type === "workflow" ? "Workflows" : type === "tool" ? "Tools" : "Agents";
  return (
    <>
      {onLoad && (
        <MpActionBtnPrimary type="button" onClick={onLoad}>
          <Download aria-hidden />
          Load {selectedCount} {typeLabel}
          {selectedCount > 1 ? "s" : ""}
        </MpActionBtnPrimary>
      )}
      {onUse && (
        <MpActionBtnPrimary type="button" onClick={onUse}>
          <Download aria-hidden />
          Use {selectedCount} {typeLabel}
          {selectedCount > 1 ? "s" : ""}
        </MpActionBtnPrimary>
      )}
      {showDelete && !hasOfficial && onDelete && (
        <MpActionBtnDanger type="button" onClick={onDelete}>
          <Trash2 aria-hidden />
          Delete {selectedCount} {typeLabelPlural}
        </MpActionBtnDanger>
      )}
    </>
  );
}

MarketplaceActionButtons.propTypes = {
  selectedCount: PropTypes.number.isRequired,
  hasOfficial: PropTypes.bool,
  onLoad: PropTypes.func,
  onDelete: PropTypes.func,
  onUse: PropTypes.func,
  type: PropTypes.oneOf(["workflow", "tool", "agent"]).isRequired,
  showDelete: PropTypes.bool,
};

export { MarketplaceActionButtons };
