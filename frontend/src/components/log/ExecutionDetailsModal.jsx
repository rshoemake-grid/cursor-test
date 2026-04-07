import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
  Download,
} from "lucide-react";
import { useState } from "react";
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
  if (!isOpen || !execution) {
    return null;
  }
  const handleDownloadLogs = async (format) => {
    if (!execution || downloading) return;
    try {
      setDownloading(true);
      const blob = await apiClient.downloadExecutionLogs(
        execution.execution_id,
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
              {getStatusIcon(execution.status)}
              <ExecModalTitleBlock>
                <ExecModalTitle>Execution Details</ExecModalTitle>
                <ExecModalSubtitle>{execution.execution_id}</ExecModalSubtitle>
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
                    <ExecutionStatusBadge status={execution.status} />
                  </ExecModalFieldSpacer>
                </div>
                <div>
                  <ExecModalFieldLabel>Workflow ID</ExecModalFieldLabel>
                  <ExecModalMonoText>{execution.workflow_id}</ExecModalMonoText>
                </div>
              </ExecModalGrid2>
              <ExecModalGrid2>
                <div>
                  <ExecModalFieldLabel>Started At</ExecModalFieldLabel>
                  <ExecModalText>
                    {new Date(execution.started_at).toLocaleString()}
                  </ExecModalText>
                </div>
                {execution.completed_at && (
                  <div>
                    <ExecModalFieldLabel>Completed At</ExecModalFieldLabel>
                    <ExecModalText>
                      {new Date(execution.completed_at).toLocaleString()}
                    </ExecModalText>
                  </div>
                )}
                <div>
                  <ExecModalFieldLabel>Duration</ExecModalFieldLabel>
                  <ExecModalText>
                    {formatExecutionDuration(
                      execution.started_at,
                      execution.completed_at,
                    )}
                  </ExecModalText>
                </div>
              </ExecModalGrid2>
              {execution.current_node && (
                <div>
                  <ExecModalFieldLabel>Current Node</ExecModalFieldLabel>
                  <ExecModalMonoText>{execution.current_node}</ExecModalMonoText>
                </div>
              )}
              {execution.error && (
                <div>
                  <ExecModalFieldLabel>Error</ExecModalFieldLabel>
                  <ExecModalErrorBox>
                    <ExecModalErrorText>{execution.error}</ExecModalErrorText>
                  </ExecModalErrorBox>
                </div>
              )}
              {execution.node_states &&
                Object.keys(execution.node_states).length > 0 && (
                  <div>
                    <ExecModalSectionLabel>Node States</ExecModalSectionLabel>
                    <ExecModalNodeStack>
                      {Object.entries(execution.node_states).map(
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
              {execution.logs && execution.logs.length > 0 && (
                <div>
                  <ExecModalSectionLabel>Logs</ExecModalSectionLabel>
                  <ExecModalLogsConsole>
                    {execution.logs.map((log, index) => (
                      <ExecModalLogLine key={index}>
                        {typeof log === "string" ? log : JSON.stringify(log)}
                      </ExecModalLogLine>
                    ))}
                  </ExecModalLogsConsole>
                </div>
              )}
              {execution.variables &&
                Object.keys(execution.variables).length > 0 && (
                  <div>
                    <ExecModalSectionLabel>Variables</ExecModalSectionLabel>
                    <ExecModalVariablesBox>
                      <ExecModalPre>
                        {JSON.stringify(execution.variables, null, 2)}
                      </ExecModalPre>
                    </ExecModalVariablesBox>
                  </div>
                )}
            </ExecModalBodyStack>
          </ExecModalBody>
          <ExecModalFooter>
            <ExecModalFooterLeft>
              {execution.logs && execution.logs.length > 0 && (
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
export { ExecutionDetailsModal as default };
