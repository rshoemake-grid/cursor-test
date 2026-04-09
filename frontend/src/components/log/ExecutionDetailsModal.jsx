import PropTypes from "prop-types";
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatExecutionDuration } from "../../utils/executionFormat";
import ExecutionStatusBadge from "../ExecutionStatusBadge";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { extractApiErrorMessage } from "../../hooks/utils/apiUtils";
import {
  ExecModalStatusIconWrap,
  ExecModalRoot,
  ExecModalBackdrop,
  ExecModalAlign,
  ExecModalDialog,
  ExecModalHeader,
  ExecModalHeaderLeft,
  ExecModalTitleBlock,
  ExecModalTitle,
  ExecModalSubtitle,
  ExecModalIconBtn,
  ExecModalBody,
  ExecModalBodyStack,
  ExecModalGrid2,
  ExecModalFieldLabel,
  ExecModalFieldSpacer,
  ExecModalMonoText,
  ExecModalText,
  ExecModalErrorBox,
  ExecModalErrorText,
  ExecModalSectionLabel,
  ExecModalNodeStack,
  ExecModalNodeCard,
  ExecModalNodeCardHeader,
  ExecModalNodeId,
  ExecModalNodeOutput,
  ExecModalLogsConsole,
  ExecModalLogLine,
  ExecModalVariablesBox,
  ExecModalPre,
  ExecModalFooter,
  ExecModalFooterLeft,
  ExecModalDownloadPrimary,
  ExecModalDownloadSecondary,
  ExecModalFooterClose,
} from "../../styles/executionDetailsModal.styled";

function ExecutionDetailsModal({
  execution,
  isOpen,
  onClose,
  apiClient = api,
}) {
  const [downloading, setDownloading] = useState(false);
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    if (!isOpen || !execution?.execution_id) {
      setDetail(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await apiClient.getExecution(execution.execution_id);
        if (!cancelled) {
          setDetail(full);
        }
      } catch (err) {
        logger.error("Failed to load execution details:", err);
        if (!cancelled) {
          setDetail(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, execution?.execution_id, apiClient]);
  if (!isOpen || !execution) {
    return null;
  }
  const display = detail ?? execution;
  const handleDownloadLogs = async (format) => {
    if (!execution || downloading) return;
    try {
      setDownloading(true);
      const blob = await apiClient.downloadExecutionLogs(
        display.execution_id,
        format,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `execution_${execution.execution_id}_logs.${format === "json" ? "json" : "txt"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Failed to download logs:", error);
      alert(
        `Failed to download logs: ${extractApiErrorMessage(error, "Unknown error")}`,
      );
    } finally {
      setDownloading(false);
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <ExecModalStatusIconWrap $tone="green" aria-hidden>
            <CheckCircle />
          </ExecModalStatusIconWrap>
        );
      case "failed":
        return (
          <ExecModalStatusIconWrap $tone="red" aria-hidden>
            <XCircle />
          </ExecModalStatusIconWrap>
        );
      case "running":
        return (
          <ExecModalStatusIconWrap $tone="blue" $pulse aria-hidden>
            <Play />
          </ExecModalStatusIconWrap>
        );
      case "pending":
        return (
          <ExecModalStatusIconWrap $tone="yellow" aria-hidden>
            <Clock />
          </ExecModalStatusIconWrap>
        );
      default:
        return (
          <ExecModalStatusIconWrap $tone="gray" aria-hidden>
            <AlertCircle />
          </ExecModalStatusIconWrap>
        );
    }
  };
  return (
    <ExecModalRoot>
      <ExecModalBackdrop onClick={onClose} />
      <ExecModalAlign
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <ExecModalDialog onClick={(e) => e.stopPropagation()}>
          <ExecModalHeader>
            <ExecModalHeaderLeft>
              {getStatusIcon(display.status)}
              <ExecModalTitleBlock>
                <ExecModalTitle>Execution Details</ExecModalTitle>
                <ExecModalSubtitle>{display.execution_id}</ExecModalSubtitle>
              </ExecModalTitleBlock>
            </ExecModalHeaderLeft>
            <ExecModalIconBtn
              type="button"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X aria-hidden />
            </ExecModalIconBtn>
          </ExecModalHeader>
          <ExecModalBody>
            <ExecModalBodyStack>
              <ExecModalGrid2>
                <div>
                  <ExecModalFieldLabel>Status</ExecModalFieldLabel>
                  <ExecModalFieldSpacer>
                    <ExecutionStatusBadge status={display.status} />
                  </ExecModalFieldSpacer>
                </div>
                <div>
                  <ExecModalFieldLabel>Workflow ID</ExecModalFieldLabel>
                  <ExecModalMonoText>{display.workflow_id}</ExecModalMonoText>
                </div>
              </ExecModalGrid2>
              <ExecModalGrid2>
                <div>
                  <ExecModalFieldLabel>Started At</ExecModalFieldLabel>
                  <ExecModalText>
                    {new Date(display.started_at).toLocaleString()}
                  </ExecModalText>
                </div>
                {display.completed_at && (
                  <div>
                    <ExecModalFieldLabel>Completed At</ExecModalFieldLabel>
                    <ExecModalText>
                      {new Date(display.completed_at).toLocaleString()}
                    </ExecModalText>
                  </div>
                )}
                <div>
                  <ExecModalFieldLabel>Duration</ExecModalFieldLabel>
                  <ExecModalText>
                    {formatExecutionDuration(
                      display.started_at,
                      display.completed_at,
                    )}
                  </ExecModalText>
                </div>
              </ExecModalGrid2>
              {display.current_node && (
                <div>
                  <ExecModalFieldLabel>Current Node</ExecModalFieldLabel>
                  <ExecModalMonoText>{display.current_node}</ExecModalMonoText>
                </div>
              )}
              {display.error && (
                <div>
                  <ExecModalFieldLabel>Error</ExecModalFieldLabel>
                  <ExecModalErrorBox>
                    <ExecModalErrorText>{display.error}</ExecModalErrorText>
                  </ExecModalErrorBox>
                </div>
              )}
              {display.node_states &&
                Object.keys(display.node_states).length > 0 && (
                  <div>
                    <ExecModalSectionLabel>Node States</ExecModalSectionLabel>
                    <ExecModalNodeStack>
                      {Object.entries(display.node_states).map(
                        ([nodeId, nodeState]) => (
                          <ExecModalNodeCard key={nodeId}>
                            <ExecModalNodeCardHeader>
                              <ExecModalNodeId>{nodeId}</ExecModalNodeId>
                              {nodeState?.status && (
                                <ExecutionStatusBadge
                                  status={nodeState.status}
                                  variant="light"
                                />
                              )}
                            </ExecModalNodeCardHeader>
                            {nodeState?.output && (
                              <ExecModalNodeOutput>
                                {String(nodeState.output)}
                              </ExecModalNodeOutput>
                            )}
                          </ExecModalNodeCard>
                        ),
                      )}
                    </ExecModalNodeStack>
                  </div>
                )}
              {display.logs && display.logs.length > 0 && (
                <div>
                  <ExecModalSectionLabel>Logs</ExecModalSectionLabel>
                  <ExecModalLogsConsole>
                    {display.logs.map((log, index) => (
                      <ExecModalLogLine key={index}>
                        {typeof log === "string" ? log : JSON.stringify(log)}
                      </ExecModalLogLine>
                    ))}
                  </ExecModalLogsConsole>
                </div>
              )}
              {display.variables &&
                Object.keys(display.variables).length > 0 && (
                  <div>
                    <ExecModalSectionLabel>Variables</ExecModalSectionLabel>
                    <ExecModalVariablesBox>
                      <ExecModalPre>
                        {JSON.stringify(display.variables, null, 2)}
                      </ExecModalPre>
                    </ExecModalVariablesBox>
                  </div>
                )}
            </ExecModalBodyStack>
          </ExecModalBody>
          <ExecModalFooter>
            <ExecModalFooterLeft>
              {display.logs && display.logs.length > 0 && (
                <>
                  <ExecModalDownloadPrimary
                    type="button"
                    onClick={() => handleDownloadLogs("text")}
                    disabled={downloading}
                  >
                    <Download aria-hidden />
                    {downloading ? "Downloading..." : "Download Logs (TXT)"}
                  </ExecModalDownloadPrimary>
                  <ExecModalDownloadSecondary
                    type="button"
                    onClick={() => handleDownloadLogs("json")}
                    disabled={downloading}
                  >
                    <Download aria-hidden />
                    {downloading ? "Downloading..." : "Download Logs (JSON)"}
                  </ExecModalDownloadSecondary>
                </>
              )}
            </ExecModalFooterLeft>
            <ExecModalFooterClose type="button" onClick={onClose}>
              Close
            </ExecModalFooterClose>
          </ExecModalFooter>
        </ExecModalDialog>
      </ExecModalAlign>
    </ExecModalRoot>
  );
}

ExecutionDetailsModal.propTypes = {
  execution: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  apiClient: PropTypes.shape({
    getExecution: PropTypes.func,
    downloadExecutionLogs: PropTypes.func,
  }),
};

export { ExecutionDetailsModal as default };
