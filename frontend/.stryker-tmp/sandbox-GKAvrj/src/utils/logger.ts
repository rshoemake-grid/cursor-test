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
const isDev = stryMutAct_9fa48("945") ? import.meta.env.DEV && process.env.NODE_ENV === 'development' : stryMutAct_9fa48("944") ? false : stryMutAct_9fa48("943") ? true : (stryCov_9fa48("943", "944", "945"), import.meta.env.DEV || (stryMutAct_9fa48("947") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("946") ? false : (stryCov_9fa48("946", "947"), process.env.NODE_ENV === (stryMutAct_9fa48("948") ? "" : (stryCov_9fa48("948"), 'development')))));
export const logger = stryMutAct_9fa48("949") ? {} : (stryCov_9fa48("949"), {
  debug: (...args: any[]) => {
    if (stryMutAct_9fa48("950")) {
      {}
    } else {
      stryCov_9fa48("950");
      if (stryMutAct_9fa48("952") ? false : stryMutAct_9fa48("951") ? true : (stryCov_9fa48("951", "952"), isDev)) {
        if (stryMutAct_9fa48("953")) {
          {}
        } else {
          stryCov_9fa48("953");
          console.log(stryMutAct_9fa48("954") ? "" : (stryCov_9fa48("954"), '[DEBUG]'), ...args);
        }
      }
    }
  },
  info: (...args: any[]) => {
    if (stryMutAct_9fa48("955")) {
      {}
    } else {
      stryCov_9fa48("955");
      if (stryMutAct_9fa48("957") ? false : stryMutAct_9fa48("956") ? true : (stryCov_9fa48("956", "957"), isDev)) {
        if (stryMutAct_9fa48("958")) {
          {}
        } else {
          stryCov_9fa48("958");
          console.info(stryMutAct_9fa48("959") ? "" : (stryCov_9fa48("959"), '[INFO]'), ...args);
        }
      }
    }
  },
  warn: (...args: any[]) => {
    if (stryMutAct_9fa48("960")) {
      {}
    } else {
      stryCov_9fa48("960");
      console.warn(stryMutAct_9fa48("961") ? "" : (stryCov_9fa48("961"), '[WARN]'), ...args);
    }
  },
  error: (...args: any[]) => {
    if (stryMutAct_9fa48("962")) {
      {}
    } else {
      stryCov_9fa48("962");
      console.error(stryMutAct_9fa48("963") ? "" : (stryCov_9fa48("963"), '[ERROR]'), ...args);
    }
  },
  log: (...args: any[]) => {
    if (stryMutAct_9fa48("964")) {
      {}
    } else {
      stryCov_9fa48("964");
      if (stryMutAct_9fa48("966") ? false : stryMutAct_9fa48("965") ? true : (stryCov_9fa48("965", "966"), isDev)) {
        if (stryMutAct_9fa48("967")) {
          {}
        } else {
          stryCov_9fa48("967");
          console.log(...args);
        }
      }
    }
  }
});