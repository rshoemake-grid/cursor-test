import PropTypes from "prop-types";
import { Clock, CheckCircle, Eye } from "lucide-react";
import ExecutionStatusBadge from "../ExecutionStatusBadge";
import {
  getExecutionStatusIcon,
  formatExecutionDuration,
  calculateExecutionProgress,
} from "../../utils/executionFormat";
import {
  LogListItemRoot,
  LogListItemRow,
  LogListCheckboxCol,
  LogCheckbox,
  LogListMain,
  LogListIdRow,
  LogListMono,
  LogListMeta,
  LogListNodeRow,
  LogListNodeLabel,
  LogListNodeValue,
  LogListProgressBlock,
  LogListProgressRow,
  LogListProgressTrack,
  LogListProgressFill,
  LogListMetaRow,
  LogListMetaItem,
  LogListDuration,
  LogListAside,
  LogListViewBtn,
} from "../../styles/logComponents.styled";

function ExecutionListItem({
  execution,
  onExecutionClick,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}) {
  const isActive =
    execution.status === "running" || execution.status === "pending";
  const progress = calculateExecutionProgress(execution.node_states);
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelect?.(execution.execution_id);
  };
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
  };
  const handleItemClick = () => {
    if (!showCheckbox) {
      onExecutionClick(execution.execution_id);
    }
  };
  return (
    <LogListItemRoot
      onClick={handleItemClick}
      $selected={isSelected}
      $isActive={isActive}
    >
      <LogListItemRow>
        {showCheckbox && (
          <LogListCheckboxCol>
            <LogCheckbox
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={handleCheckboxClick}
              aria-label={`Select execution ${execution.execution_id}`}
            />
          </LogListCheckboxCol>
        )}
        <LogListMain>
          <LogListIdRow>
            {getExecutionStatusIcon(execution.status)}
            <LogListMono>{execution.execution_id.slice(0, 8)}...</LogListMono>
            <ExecutionStatusBadge status={execution.status} variant="light" />
            <LogListMeta>
              Workflow: {execution.workflow_id.slice(0, 8)}...
            </LogListMeta>
          </LogListIdRow>
          {execution.current_node && (
            <LogListNodeRow>
              <LogListNodeLabel>Current Node:</LogListNodeLabel>
              <LogListNodeValue>{execution.current_node}</LogListNodeValue>
            </LogListNodeRow>
          )}
          {execution.status === "running" && execution.node_states && (
            <LogListProgressBlock>
              <LogListProgressRow>
                <span>Progress:</span>
                <LogListProgressTrack>
                  <LogListProgressFill
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </LogListProgressTrack>
              </LogListProgressRow>
            </LogListProgressBlock>
          )}
          <LogListMetaRow>
            <LogListMetaItem>
              <Clock aria-hidden />
              <span>
                Started: {new Date(execution.started_at).toLocaleString()}
              </span>
            </LogListMetaItem>
            {execution.completed_at && (
              <LogListMetaItem>
                <CheckCircle aria-hidden />
                <span>
                  Completed:{" "}
                  {new Date(execution.completed_at).toLocaleString()}
                </span>
              </LogListMetaItem>
            )}
            <LogListDuration>
              Duration:{" "}
              {formatExecutionDuration(
                execution.started_at,
                execution.completed_at,
              )}
            </LogListDuration>
          </LogListMetaRow>
        </LogListMain>
        <LogListAside>
          <LogListViewBtn
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExecutionClick(execution.execution_id);
            }}
          >
            <Eye aria-hidden />
            View
          </LogListViewBtn>
        </LogListAside>
      </LogListItemRow>
    </LogListItemRoot>
  );
}

ExecutionListItem.propTypes = {
  execution: PropTypes.object.isRequired,
  onExecutionClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  showCheckbox: PropTypes.bool,
};

export { ExecutionListItem as default };
