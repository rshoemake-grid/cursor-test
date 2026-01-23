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
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

/**
 * Get Tailwind CSS classes for execution status badge
 */
export const getExecutionStatusColor = (status: string): string => {
  if (stryMutAct_9fa48("747")) {
    {}
  } else {
    stryCov_9fa48("747");
    const statusMap: Record<string, string> = stryMutAct_9fa48("748") ? {} : (stryCov_9fa48("748"), {
      completed: stryMutAct_9fa48("749") ? "" : (stryCov_9fa48("749"), 'bg-green-900 text-green-200'),
      failed: stryMutAct_9fa48("750") ? "" : (stryCov_9fa48("750"), 'bg-red-900 text-red-200'),
      running: stryMutAct_9fa48("751") ? "" : (stryCov_9fa48("751"), 'bg-blue-900 text-blue-200'),
      pending: stryMutAct_9fa48("752") ? "" : (stryCov_9fa48("752"), 'bg-yellow-900 text-yellow-200'),
      paused: stryMutAct_9fa48("753") ? "" : (stryCov_9fa48("753"), 'bg-gray-900 text-gray-200')
    });
    return stryMutAct_9fa48("756") ? statusMap[status] && 'bg-gray-900 text-gray-200' : stryMutAct_9fa48("755") ? false : stryMutAct_9fa48("754") ? true : (stryCov_9fa48("754", "755", "756"), statusMap[status] || (stryMutAct_9fa48("757") ? "" : (stryCov_9fa48("757"), 'bg-gray-900 text-gray-200')));
  }
};

/**
 * Get Tailwind CSS classes for execution status badge (light theme variant)
 */
export const getExecutionStatusColorLight = (status: string): string => {
  if (stryMutAct_9fa48("758")) {
    {}
  } else {
    stryCov_9fa48("758");
    const statusMap: Record<string, string> = stryMutAct_9fa48("759") ? {} : (stryCov_9fa48("759"), {
      completed: stryMutAct_9fa48("760") ? "" : (stryCov_9fa48("760"), 'bg-green-100 text-green-800'),
      failed: stryMutAct_9fa48("761") ? "" : (stryCov_9fa48("761"), 'bg-red-100 text-red-800'),
      running: stryMutAct_9fa48("762") ? "" : (stryCov_9fa48("762"), 'bg-blue-100 text-blue-800'),
      pending: stryMutAct_9fa48("763") ? "" : (stryCov_9fa48("763"), 'bg-yellow-100 text-yellow-800'),
      paused: stryMutAct_9fa48("764") ? "" : (stryCov_9fa48("764"), 'bg-gray-100 text-gray-800')
    });
    return stryMutAct_9fa48("767") ? statusMap[status] && 'bg-gray-100 text-gray-800' : stryMutAct_9fa48("766") ? false : stryMutAct_9fa48("765") ? true : (stryCov_9fa48("765", "766", "767"), statusMap[status] || (stryMutAct_9fa48("768") ? "" : (stryCov_9fa48("768"), 'bg-gray-100 text-gray-800')));
  }
};

/**
 * Type guard to check if a string is a valid execution status
 */
export const isValidExecutionStatus = (status: string): status is ExecutionStatus => {
  if (stryMutAct_9fa48("769")) {
    {}
  } else {
    stryCov_9fa48("769");
    return (stryMutAct_9fa48("770") ? [] : (stryCov_9fa48("770"), [stryMutAct_9fa48("771") ? "" : (stryCov_9fa48("771"), 'pending'), stryMutAct_9fa48("772") ? "" : (stryCov_9fa48("772"), 'running'), stryMutAct_9fa48("773") ? "" : (stryCov_9fa48("773"), 'completed'), stryMutAct_9fa48("774") ? "" : (stryCov_9fa48("774"), 'failed'), stryMutAct_9fa48("775") ? "" : (stryCov_9fa48("775"), 'paused')])).includes(status);
  }
};