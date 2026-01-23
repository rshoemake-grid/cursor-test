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
const isDev = stryMutAct_9fa48("804") ? import.meta.env.DEV && process.env.NODE_ENV === 'development' : stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803", "804"), import.meta.env.DEV || (stryMutAct_9fa48("806") ? process.env.NODE_ENV !== 'development' : stryMutAct_9fa48("805") ? false : (stryCov_9fa48("805", "806"), process.env.NODE_ENV === (stryMutAct_9fa48("807") ? "" : (stryCov_9fa48("807"), 'development')))));
export const logger = stryMutAct_9fa48("808") ? {} : (stryCov_9fa48("808"), {
  debug: (...args: any[]) => {
    if (stryMutAct_9fa48("809")) {
      {}
    } else {
      stryCov_9fa48("809");
      if (stryMutAct_9fa48("811") ? false : stryMutAct_9fa48("810") ? true : (stryCov_9fa48("810", "811"), isDev)) {
        if (stryMutAct_9fa48("812")) {
          {}
        } else {
          stryCov_9fa48("812");
          console.log(stryMutAct_9fa48("813") ? "" : (stryCov_9fa48("813"), '[DEBUG]'), ...args);
        }
      }
    }
  },
  info: (...args: any[]) => {
    if (stryMutAct_9fa48("814")) {
      {}
    } else {
      stryCov_9fa48("814");
      if (stryMutAct_9fa48("816") ? false : stryMutAct_9fa48("815") ? true : (stryCov_9fa48("815", "816"), isDev)) {
        if (stryMutAct_9fa48("817")) {
          {}
        } else {
          stryCov_9fa48("817");
          console.info(stryMutAct_9fa48("818") ? "" : (stryCov_9fa48("818"), '[INFO]'), ...args);
        }
      }
    }
  },
  warn: (...args: any[]) => {
    if (stryMutAct_9fa48("819")) {
      {}
    } else {
      stryCov_9fa48("819");
      console.warn(stryMutAct_9fa48("820") ? "" : (stryCov_9fa48("820"), '[WARN]'), ...args);
    }
  },
  error: (...args: any[]) => {
    if (stryMutAct_9fa48("821")) {
      {}
    } else {
      stryCov_9fa48("821");
      console.error(stryMutAct_9fa48("822") ? "" : (stryCov_9fa48("822"), '[ERROR]'), ...args);
    }
  },
  log: (...args: any[]) => {
    if (stryMutAct_9fa48("823")) {
      {}
    } else {
      stryCov_9fa48("823");
      if (stryMutAct_9fa48("825") ? false : stryMutAct_9fa48("824") ? true : (stryCov_9fa48("824", "825"), isDev)) {
        if (stryMutAct_9fa48("826")) {
          {}
        } else {
          stryCov_9fa48("826");
          console.log(...args);
        }
      }
    }
  }
});