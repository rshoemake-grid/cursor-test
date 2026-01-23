// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useCallback } from 'react';
import { api } from '../api/client';
import type { WorkflowDefinition, ExecutionState } from '../types/workflow';
import { logger } from '../utils/logger';

/**
 * Custom hook for workflow API operations
 * Follows Dependency Inversion Principle by abstracting API calls
 * Makes components easier to test by allowing API injection
 */
export function useWorkflowAPI() {
  if (stryMutAct_9fa48("749")) {
    {}
  } else {
    stryCov_9fa48("749");
    const getWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
      if (stryMutAct_9fa48("750")) {
        {}
      } else {
        stryCov_9fa48("750");
        try {
          if (stryMutAct_9fa48("751")) {
            {}
          } else {
            stryCov_9fa48("751");
            return await api.getWorkflows();
          }
        } catch (error) {
          if (stryMutAct_9fa48("752")) {
            {}
          } else {
            stryCov_9fa48("752");
            logger.error(stryMutAct_9fa48("753") ? "" : (stryCov_9fa48("753"), 'Failed to fetch workflows:'), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("754") ? ["Stryker was here"] : (stryCov_9fa48("754"), []));
    const getWorkflow = useCallback(async (id: string): Promise<WorkflowDefinition> => {
      if (stryMutAct_9fa48("755")) {
        {}
      } else {
        stryCov_9fa48("755");
        try {
          if (stryMutAct_9fa48("756")) {
            {}
          } else {
            stryCov_9fa48("756");
            return await api.getWorkflow(id);
          }
        } catch (error) {
          if (stryMutAct_9fa48("757")) {
            {}
          } else {
            stryCov_9fa48("757");
            logger.error(stryMutAct_9fa48("758") ? `` : (stryCov_9fa48("758"), `Failed to fetch workflow ${id}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("759") ? ["Stryker was here"] : (stryCov_9fa48("759"), []));
    const createWorkflow = useCallback(async (workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
      if (stryMutAct_9fa48("760")) {
        {}
      } else {
        stryCov_9fa48("760");
        try {
          if (stryMutAct_9fa48("761")) {
            {}
          } else {
            stryCov_9fa48("761");
            return await api.createWorkflow(workflow);
          }
        } catch (error) {
          if (stryMutAct_9fa48("762")) {
            {}
          } else {
            stryCov_9fa48("762");
            logger.error(stryMutAct_9fa48("763") ? "" : (stryCov_9fa48("763"), 'Failed to create workflow:'), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("764") ? ["Stryker was here"] : (stryCov_9fa48("764"), []));
    const updateWorkflow = useCallback(async (id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
      if (stryMutAct_9fa48("765")) {
        {}
      } else {
        stryCov_9fa48("765");
        try {
          if (stryMutAct_9fa48("766")) {
            {}
          } else {
            stryCov_9fa48("766");
            return await api.updateWorkflow(id, workflow);
          }
        } catch (error) {
          if (stryMutAct_9fa48("767")) {
            {}
          } else {
            stryCov_9fa48("767");
            logger.error(stryMutAct_9fa48("768") ? `` : (stryCov_9fa48("768"), `Failed to update workflow ${id}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("769") ? ["Stryker was here"] : (stryCov_9fa48("769"), []));
    const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
      if (stryMutAct_9fa48("770")) {
        {}
      } else {
        stryCov_9fa48("770");
        try {
          if (stryMutAct_9fa48("771")) {
            {}
          } else {
            stryCov_9fa48("771");
            await api.deleteWorkflow(id);
          }
        } catch (error) {
          if (stryMutAct_9fa48("772")) {
            {}
          } else {
            stryCov_9fa48("772");
            logger.error(stryMutAct_9fa48("773") ? `` : (stryCov_9fa48("773"), `Failed to delete workflow ${id}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("774") ? ["Stryker was here"] : (stryCov_9fa48("774"), []));
    const executeWorkflow = useCallback(async (workflowId: string, inputs?: Record<string, any>): Promise<ExecutionState> => {
      if (stryMutAct_9fa48("775")) {
        {}
      } else {
        stryCov_9fa48("775");
        try {
          if (stryMutAct_9fa48("776")) {
            {}
          } else {
            stryCov_9fa48("776");
            return await api.executeWorkflow(workflowId, inputs);
          }
        } catch (error) {
          if (stryMutAct_9fa48("777")) {
            {}
          } else {
            stryCov_9fa48("777");
            logger.error(stryMutAct_9fa48("778") ? `` : (stryCov_9fa48("778"), `Failed to execute workflow ${workflowId}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("779") ? ["Stryker was here"] : (stryCov_9fa48("779"), []));
    const getExecution = useCallback(async (executionId: string): Promise<ExecutionState> => {
      if (stryMutAct_9fa48("780")) {
        {}
      } else {
        stryCov_9fa48("780");
        try {
          if (stryMutAct_9fa48("781")) {
            {}
          } else {
            stryCov_9fa48("781");
            return await api.getExecution(executionId);
          }
        } catch (error) {
          if (stryMutAct_9fa48("782")) {
            {}
          } else {
            stryCov_9fa48("782");
            logger.error(stryMutAct_9fa48("783") ? `` : (stryCov_9fa48("783"), `Failed to fetch execution ${executionId}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("784") ? ["Stryker was here"] : (stryCov_9fa48("784"), []));
    return stryMutAct_9fa48("785") ? {} : (stryCov_9fa48("785"), {
      getWorkflows,
      getWorkflow,
      createWorkflow,
      updateWorkflow,
      deleteWorkflow,
      executeWorkflow,
      getExecution
    });
  }
}