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
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

/**
 * Get Tailwind CSS classes for log level badge
 */
export const getLogLevelColor = (level: string): string => {
  if (stryMutAct_9fa48("917")) {
    {}
  } else {
    stryCov_9fa48("917");
    const levelMap: Record<string, string> = stryMutAct_9fa48("918") ? {} : (stryCov_9fa48("918"), {
      ERROR: stryMutAct_9fa48("919") ? "" : (stryCov_9fa48("919"), 'bg-red-900/30 text-red-200'),
      WARNING: stryMutAct_9fa48("920") ? "" : (stryCov_9fa48("920"), 'bg-yellow-900/30 text-yellow-200'),
      INFO: stryMutAct_9fa48("921") ? "" : (stryCov_9fa48("921"), 'bg-gray-800 text-gray-300'),
      DEBUG: stryMutAct_9fa48("922") ? "" : (stryCov_9fa48("922"), 'bg-blue-900/30 text-blue-200')
    });
    return stryMutAct_9fa48("925") ? levelMap[level] && 'bg-gray-800 text-gray-300' : stryMutAct_9fa48("924") ? false : stryMutAct_9fa48("923") ? true : (stryCov_9fa48("923", "924", "925"), levelMap[level] || (stryMutAct_9fa48("926") ? "" : (stryCov_9fa48("926"), 'bg-gray-800 text-gray-300')));
  }
};

/**
 * Get Tailwind CSS classes for log level text color
 */
export const getLogLevelTextColor = (level: string): string => {
  if (stryMutAct_9fa48("927")) {
    {}
  } else {
    stryCov_9fa48("927");
    const levelMap: Record<string, string> = stryMutAct_9fa48("928") ? {} : (stryCov_9fa48("928"), {
      ERROR: stryMutAct_9fa48("929") ? "" : (stryCov_9fa48("929"), 'text-red-400'),
      WARNING: stryMutAct_9fa48("930") ? "" : (stryCov_9fa48("930"), 'text-yellow-400'),
      INFO: stryMutAct_9fa48("931") ? "" : (stryCov_9fa48("931"), 'text-gray-300'),
      DEBUG: stryMutAct_9fa48("932") ? "" : (stryCov_9fa48("932"), 'text-blue-400')
    });
    return stryMutAct_9fa48("935") ? levelMap[level] && 'text-gray-300' : stryMutAct_9fa48("934") ? false : stryMutAct_9fa48("933") ? true : (stryCov_9fa48("933", "934", "935"), levelMap[level] || (stryMutAct_9fa48("936") ? "" : (stryCov_9fa48("936"), 'text-gray-300')));
  }
};

/**
 * Type guard to check if a string is a valid log level
 */
export const isValidLogLevel = (level: string): level is LogLevel => {
  if (stryMutAct_9fa48("937")) {
    {}
  } else {
    stryCov_9fa48("937");
    return (stryMutAct_9fa48("938") ? [] : (stryCov_9fa48("938"), [stryMutAct_9fa48("939") ? "" : (stryCov_9fa48("939"), 'INFO'), stryMutAct_9fa48("940") ? "" : (stryCov_9fa48("940"), 'WARNING'), stryMutAct_9fa48("941") ? "" : (stryCov_9fa48("941"), 'ERROR'), stryMutAct_9fa48("942") ? "" : (stryCov_9fa48("942"), 'DEBUG')])).includes(level);
  }
};