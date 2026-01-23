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
  if (stryMutAct_9fa48("888")) {
    {}
  } else {
    stryCov_9fa48("888");
    const statusMap: Record<string, string> = stryMutAct_9fa48("889") ? {} : (stryCov_9fa48("889"), {
      completed: stryMutAct_9fa48("890") ? "" : (stryCov_9fa48("890"), 'bg-green-900 text-green-200'),
      failed: stryMutAct_9fa48("891") ? "" : (stryCov_9fa48("891"), 'bg-red-900 text-red-200'),
      running: stryMutAct_9fa48("892") ? "" : (stryCov_9fa48("892"), 'bg-blue-900 text-blue-200'),
      pending: stryMutAct_9fa48("893") ? "" : (stryCov_9fa48("893"), 'bg-yellow-900 text-yellow-200'),
      paused: stryMutAct_9fa48("894") ? "" : (stryCov_9fa48("894"), 'bg-gray-900 text-gray-200')
    });
    return stryMutAct_9fa48("897") ? statusMap[status] && 'bg-gray-900 text-gray-200' : stryMutAct_9fa48("896") ? false : stryMutAct_9fa48("895") ? true : (stryCov_9fa48("895", "896", "897"), statusMap[status] || (stryMutAct_9fa48("898") ? "" : (stryCov_9fa48("898"), 'bg-gray-900 text-gray-200')));
  }
};

/**
 * Get Tailwind CSS classes for execution status badge (light theme variant)
 */
export const getExecutionStatusColorLight = (status: string): string => {
  if (stryMutAct_9fa48("899")) {
    {}
  } else {
    stryCov_9fa48("899");
    const statusMap: Record<string, string> = stryMutAct_9fa48("900") ? {} : (stryCov_9fa48("900"), {
      completed: stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), 'bg-green-100 text-green-800'),
      failed: stryMutAct_9fa48("902") ? "" : (stryCov_9fa48("902"), 'bg-red-100 text-red-800'),
      running: stryMutAct_9fa48("903") ? "" : (stryCov_9fa48("903"), 'bg-blue-100 text-blue-800'),
      pending: stryMutAct_9fa48("904") ? "" : (stryCov_9fa48("904"), 'bg-yellow-100 text-yellow-800'),
      paused: stryMutAct_9fa48("905") ? "" : (stryCov_9fa48("905"), 'bg-gray-100 text-gray-800')
    });
    return stryMutAct_9fa48("908") ? statusMap[status] && 'bg-gray-100 text-gray-800' : stryMutAct_9fa48("907") ? false : stryMutAct_9fa48("906") ? true : (stryCov_9fa48("906", "907", "908"), statusMap[status] || (stryMutAct_9fa48("909") ? "" : (stryCov_9fa48("909"), 'bg-gray-100 text-gray-800')));
  }
};

/**
 * Type guard to check if a string is a valid execution status
 */
export const isValidExecutionStatus = (status: string): status is ExecutionStatus => {
  if (stryMutAct_9fa48("910")) {
    {}
  } else {
    stryCov_9fa48("910");
    return (stryMutAct_9fa48("911") ? [] : (stryCov_9fa48("911"), [stryMutAct_9fa48("912") ? "" : (stryCov_9fa48("912"), 'pending'), stryMutAct_9fa48("913") ? "" : (stryCov_9fa48("913"), 'running'), stryMutAct_9fa48("914") ? "" : (stryCov_9fa48("914"), 'completed'), stryMutAct_9fa48("915") ? "" : (stryCov_9fa48("915"), 'failed'), stryMutAct_9fa48("916") ? "" : (stryCov_9fa48("916"), 'paused')])).includes(status);
  }
};