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
  if (stryMutAct_9fa48("776")) {
    {}
  } else {
    stryCov_9fa48("776");
    const levelMap: Record<string, string> = stryMutAct_9fa48("777") ? {} : (stryCov_9fa48("777"), {
      ERROR: stryMutAct_9fa48("778") ? "" : (stryCov_9fa48("778"), 'bg-red-900/30 text-red-200'),
      WARNING: stryMutAct_9fa48("779") ? "" : (stryCov_9fa48("779"), 'bg-yellow-900/30 text-yellow-200'),
      INFO: stryMutAct_9fa48("780") ? "" : (stryCov_9fa48("780"), 'bg-gray-800 text-gray-300'),
      DEBUG: stryMutAct_9fa48("781") ? "" : (stryCov_9fa48("781"), 'bg-blue-900/30 text-blue-200')
    });
    return stryMutAct_9fa48("784") ? levelMap[level] && 'bg-gray-800 text-gray-300' : stryMutAct_9fa48("783") ? false : stryMutAct_9fa48("782") ? true : (stryCov_9fa48("782", "783", "784"), levelMap[level] || (stryMutAct_9fa48("785") ? "" : (stryCov_9fa48("785"), 'bg-gray-800 text-gray-300')));
  }
};

/**
 * Get Tailwind CSS classes for log level text color
 */
export const getLogLevelTextColor = (level: string): string => {
  if (stryMutAct_9fa48("786")) {
    {}
  } else {
    stryCov_9fa48("786");
    const levelMap: Record<string, string> = stryMutAct_9fa48("787") ? {} : (stryCov_9fa48("787"), {
      ERROR: stryMutAct_9fa48("788") ? "" : (stryCov_9fa48("788"), 'text-red-400'),
      WARNING: stryMutAct_9fa48("789") ? "" : (stryCov_9fa48("789"), 'text-yellow-400'),
      INFO: stryMutAct_9fa48("790") ? "" : (stryCov_9fa48("790"), 'text-gray-300'),
      DEBUG: stryMutAct_9fa48("791") ? "" : (stryCov_9fa48("791"), 'text-blue-400')
    });
    return stryMutAct_9fa48("794") ? levelMap[level] && 'text-gray-300' : stryMutAct_9fa48("793") ? false : stryMutAct_9fa48("792") ? true : (stryCov_9fa48("792", "793", "794"), levelMap[level] || (stryMutAct_9fa48("795") ? "" : (stryCov_9fa48("795"), 'text-gray-300')));
  }
};

/**
 * Type guard to check if a string is a valid log level
 */
export const isValidLogLevel = (level: string): level is LogLevel => {
  if (stryMutAct_9fa48("796")) {
    {}
  } else {
    stryCov_9fa48("796");
    return (stryMutAct_9fa48("797") ? [] : (stryCov_9fa48("797"), [stryMutAct_9fa48("798") ? "" : (stryCov_9fa48("798"), 'INFO'), stryMutAct_9fa48("799") ? "" : (stryCov_9fa48("799"), 'WARNING'), stryMutAct_9fa48("800") ? "" : (stryCov_9fa48("800"), 'ERROR'), stryMutAct_9fa48("801") ? "" : (stryCov_9fa48("801"), 'DEBUG')])).includes(level);
  }
};