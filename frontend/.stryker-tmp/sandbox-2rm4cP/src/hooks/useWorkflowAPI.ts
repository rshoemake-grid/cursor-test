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
  if (stryMutAct_9fa48("608")) {
    {}
  } else {
    stryCov_9fa48("608");
    const getWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
      if (stryMutAct_9fa48("609")) {
        {}
      } else {
        stryCov_9fa48("609");
        try {
          if (stryMutAct_9fa48("610")) {
            {}
          } else {
            stryCov_9fa48("610");
            return await api.getWorkflows();
          }
        } catch (error) {
          if (stryMutAct_9fa48("611")) {
            {}
          } else {
            stryCov_9fa48("611");
            logger.error(stryMutAct_9fa48("612") ? "" : (stryCov_9fa48("612"), 'Failed to fetch workflows:'), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("613") ? ["Stryker was here"] : (stryCov_9fa48("613"), []));
    const getWorkflow = useCallback(async (id: string): Promise<WorkflowDefinition> => {
      if (stryMutAct_9fa48("614")) {
        {}
      } else {
        stryCov_9fa48("614");
        try {
          if (stryMutAct_9fa48("615")) {
            {}
          } else {
            stryCov_9fa48("615");
            return await api.getWorkflow(id);
          }
        } catch (error) {
          if (stryMutAct_9fa48("616")) {
            {}
          } else {
            stryCov_9fa48("616");
            logger.error(stryMutAct_9fa48("617") ? `` : (stryCov_9fa48("617"), `Failed to fetch workflow ${id}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("618") ? ["Stryker was here"] : (stryCov_9fa48("618"), []));
    const createWorkflow = useCallback(async (workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
      if (stryMutAct_9fa48("619")) {
        {}
      } else {
        stryCov_9fa48("619");
        try {
          if (stryMutAct_9fa48("620")) {
            {}
          } else {
            stryCov_9fa48("620");
            return await api.createWorkflow(workflow);
          }
        } catch (error) {
          if (stryMutAct_9fa48("621")) {
            {}
          } else {
            stryCov_9fa48("621");
            logger.error(stryMutAct_9fa48("622") ? "" : (stryCov_9fa48("622"), 'Failed to create workflow:'), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("623") ? ["Stryker was here"] : (stryCov_9fa48("623"), []));
    const updateWorkflow = useCallback(async (id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition> => {
      if (stryMutAct_9fa48("624")) {
        {}
      } else {
        stryCov_9fa48("624");
        try {
          if (stryMutAct_9fa48("625")) {
            {}
          } else {
            stryCov_9fa48("625");
            return await api.updateWorkflow(id, workflow);
          }
        } catch (error) {
          if (stryMutAct_9fa48("626")) {
            {}
          } else {
            stryCov_9fa48("626");
            logger.error(stryMutAct_9fa48("627") ? `` : (stryCov_9fa48("627"), `Failed to update workflow ${id}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("628") ? ["Stryker was here"] : (stryCov_9fa48("628"), []));
    const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
      if (stryMutAct_9fa48("629")) {
        {}
      } else {
        stryCov_9fa48("629");
        try {
          if (stryMutAct_9fa48("630")) {
            {}
          } else {
            stryCov_9fa48("630");
            await api.deleteWorkflow(id);
          }
        } catch (error) {
          if (stryMutAct_9fa48("631")) {
            {}
          } else {
            stryCov_9fa48("631");
            logger.error(stryMutAct_9fa48("632") ? `` : (stryCov_9fa48("632"), `Failed to delete workflow ${id}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("633") ? ["Stryker was here"] : (stryCov_9fa48("633"), []));
    const executeWorkflow = useCallback(async (workflowId: string, inputs?: Record<string, any>): Promise<ExecutionState> => {
      if (stryMutAct_9fa48("634")) {
        {}
      } else {
        stryCov_9fa48("634");
        try {
          if (stryMutAct_9fa48("635")) {
            {}
          } else {
            stryCov_9fa48("635");
            return await api.executeWorkflow(workflowId, inputs);
          }
        } catch (error) {
          if (stryMutAct_9fa48("636")) {
            {}
          } else {
            stryCov_9fa48("636");
            logger.error(stryMutAct_9fa48("637") ? `` : (stryCov_9fa48("637"), `Failed to execute workflow ${workflowId}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("638") ? ["Stryker was here"] : (stryCov_9fa48("638"), []));
    const getExecution = useCallback(async (executionId: string): Promise<ExecutionState> => {
      if (stryMutAct_9fa48("639")) {
        {}
      } else {
        stryCov_9fa48("639");
        try {
          if (stryMutAct_9fa48("640")) {
            {}
          } else {
            stryCov_9fa48("640");
            return await api.getExecution(executionId);
          }
        } catch (error) {
          if (stryMutAct_9fa48("641")) {
            {}
          } else {
            stryCov_9fa48("641");
            logger.error(stryMutAct_9fa48("642") ? `` : (stryCov_9fa48("642"), `Failed to fetch execution ${executionId}:`), error);
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("643") ? ["Stryker was here"] : (stryCov_9fa48("643"), []));
    return stryMutAct_9fa48("644") ? {} : (stryCov_9fa48("644"), {
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