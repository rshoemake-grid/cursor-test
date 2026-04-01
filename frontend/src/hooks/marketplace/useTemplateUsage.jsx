import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logger as defaultLogger } from "../../utils/logger";
import { buildAuthHeaders } from "../utils/apiUtils";
function useTemplateUsage({
  token,
  httpClient,
  apiBaseUrl,
  logger = defaultLogger
}) {
  const navigate = useNavigate();
  const useTemplate = useCallback(async (templateId) => {
    try {
      const headers = buildAuthHeaders({ token });
      const response = await httpClient.post(
        `${apiBaseUrl}/templates/${templateId}/use`,
        {},
        headers
      );
      if (response.ok) {
        const workflow = await response.json();
        logger.debug("Created workflow from template:", workflow);
        navigate(`/?workflow=${workflow.id}&_new=${Date.now()}`);
      } else {
        logger.error("Failed to use template:", await response.text());
      }
    } catch (error) {
      logger.error("Failed to use template:", error);
    }
  }, [token, httpClient, apiBaseUrl, navigate, logger]);
  return { useTemplate };
}
export {
  useTemplateUsage
};
