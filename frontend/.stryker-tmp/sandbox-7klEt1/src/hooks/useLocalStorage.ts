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
import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook for localStorage with consistent error handling
 * Follows Dependency Inversion Principle by abstracting storage access
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
  if (stryMutAct_9fa48("396")) {
    {}
  } else {
    stryCov_9fa48("396");
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(() => {
      if (stryMutAct_9fa48("397")) {
        {}
      } else {
        stryCov_9fa48("397");
        if (stryMutAct_9fa48("400") ? typeof window !== 'undefined' : stryMutAct_9fa48("399") ? false : stryMutAct_9fa48("398") ? true : (stryCov_9fa48("398", "399", "400"), typeof window === (stryMutAct_9fa48("401") ? "" : (stryCov_9fa48("401"), 'undefined')))) {
          if (stryMutAct_9fa48("402")) {
            {}
          } else {
            stryCov_9fa48("402");
            return initialValue;
          }
        }
        try {
          if (stryMutAct_9fa48("403")) {
            {}
          } else {
            stryCov_9fa48("403");
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
          }
        } catch (error) {
          if (stryMutAct_9fa48("404")) {
            {}
          } else {
            stryCov_9fa48("404");
            logger.error(stryMutAct_9fa48("405") ? `` : (stryCov_9fa48("405"), `Error reading localStorage key "${key}":`), error);
            return initialValue;
          }
        }
      }
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = useCallback((value: T | ((val: T) => T)) => {
      if (stryMutAct_9fa48("406")) {
        {}
      } else {
        stryCov_9fa48("406");
        try {
          if (stryMutAct_9fa48("407")) {
            {}
          } else {
            stryCov_9fa48("407");
            // Allow value to be a function so we have the same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (stryMutAct_9fa48("410") ? typeof window === 'undefined' : stryMutAct_9fa48("409") ? false : stryMutAct_9fa48("408") ? true : (stryCov_9fa48("408", "409", "410"), typeof window !== (stryMutAct_9fa48("411") ? "" : (stryCov_9fa48("411"), 'undefined')))) {
              if (stryMutAct_9fa48("412")) {
                {}
              } else {
                stryCov_9fa48("412");
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
              }
            }
          }
        } catch (error) {
          if (stryMutAct_9fa48("413")) {
            {}
          } else {
            stryCov_9fa48("413");
            logger.error(stryMutAct_9fa48("414") ? `` : (stryCov_9fa48("414"), `Error setting localStorage key "${key}":`), error);
          }
        }
      }
    }, stryMutAct_9fa48("415") ? [] : (stryCov_9fa48("415"), [key, storedValue]));

    // Remove value from localStorage
    const removeValue = useCallback(() => {
      if (stryMutAct_9fa48("416")) {
        {}
      } else {
        stryCov_9fa48("416");
        try {
          if (stryMutAct_9fa48("417")) {
            {}
          } else {
            stryCov_9fa48("417");
            setStoredValue(initialValue);
            if (stryMutAct_9fa48("420") ? typeof window === 'undefined' : stryMutAct_9fa48("419") ? false : stryMutAct_9fa48("418") ? true : (stryCov_9fa48("418", "419", "420"), typeof window !== (stryMutAct_9fa48("421") ? "" : (stryCov_9fa48("421"), 'undefined')))) {
              if (stryMutAct_9fa48("422")) {
                {}
              } else {
                stryCov_9fa48("422");
                window.localStorage.removeItem(key);
              }
            }
          }
        } catch (error) {
          if (stryMutAct_9fa48("423")) {
            {}
          } else {
            stryCov_9fa48("423");
            logger.error(stryMutAct_9fa48("424") ? `` : (stryCov_9fa48("424"), `Error removing localStorage key "${key}":`), error);
          }
        }
      }
    }, stryMutAct_9fa48("425") ? [] : (stryCov_9fa48("425"), [key, initialValue]));

    // Listen for changes to this key in other tabs/windows
    useEffect(() => {
      if (stryMutAct_9fa48("426")) {
        {}
      } else {
        stryCov_9fa48("426");
        if (stryMutAct_9fa48("429") ? typeof window !== 'undefined' : stryMutAct_9fa48("428") ? false : stryMutAct_9fa48("427") ? true : (stryCov_9fa48("427", "428", "429"), typeof window === (stryMutAct_9fa48("430") ? "" : (stryCov_9fa48("430"), 'undefined')))) {
          if (stryMutAct_9fa48("431")) {
            {}
          } else {
            stryCov_9fa48("431");
            return;
          }
        }
        const handleStorageChange = (e: StorageEvent) => {
          if (stryMutAct_9fa48("432")) {
            {}
          } else {
            stryCov_9fa48("432");
            if (stryMutAct_9fa48("435") ? e.key === key || e.newValue : stryMutAct_9fa48("434") ? false : stryMutAct_9fa48("433") ? true : (stryCov_9fa48("433", "434", "435"), (stryMutAct_9fa48("437") ? e.key !== key : stryMutAct_9fa48("436") ? true : (stryCov_9fa48("436", "437"), e.key === key)) && e.newValue)) {
              if (stryMutAct_9fa48("438")) {
                {}
              } else {
                stryCov_9fa48("438");
                try {
                  if (stryMutAct_9fa48("439")) {
                    {}
                  } else {
                    stryCov_9fa48("439");
                    setStoredValue(JSON.parse(e.newValue));
                  }
                } catch (error) {
                  if (stryMutAct_9fa48("440")) {
                    {}
                  } else {
                    stryCov_9fa48("440");
                    logger.error(stryMutAct_9fa48("441") ? `` : (stryCov_9fa48("441"), `Error parsing storage event for key "${key}":`), error);
                  }
                }
              }
            }
          }
        };
        window.addEventListener(stryMutAct_9fa48("442") ? "" : (stryCov_9fa48("442"), 'storage'), handleStorageChange);
        return stryMutAct_9fa48("443") ? () => undefined : (stryCov_9fa48("443"), () => window.removeEventListener(stryMutAct_9fa48("444") ? "" : (stryCov_9fa48("444"), 'storage'), handleStorageChange));
      }
    }, stryMutAct_9fa48("445") ? [] : (stryCov_9fa48("445"), [key]));
    return stryMutAct_9fa48("446") ? [] : (stryCov_9fa48("446"), [storedValue, setValue, removeValue]);
  }
}

/**
 * Simple localStorage getter with error handling
 * Handles both JSON strings and plain strings (for backward compatibility)
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (stryMutAct_9fa48("447")) {
    {}
  } else {
    stryCov_9fa48("447");
    if (stryMutAct_9fa48("450") ? typeof window !== 'undefined' : stryMutAct_9fa48("449") ? false : stryMutAct_9fa48("448") ? true : (stryCov_9fa48("448", "449", "450"), typeof window === (stryMutAct_9fa48("451") ? "" : (stryCov_9fa48("451"), 'undefined')))) {
      if (stryMutAct_9fa48("452")) {
        {}
      } else {
        stryCov_9fa48("452");
        return defaultValue;
      }
    }
    try {
      if (stryMutAct_9fa48("453")) {
        {}
      } else {
        stryCov_9fa48("453");
        const item = window.localStorage.getItem(key);
        if (stryMutAct_9fa48("456") ? false : stryMutAct_9fa48("455") ? true : stryMutAct_9fa48("454") ? item : (stryCov_9fa48("454", "455", "456"), !item)) {
          if (stryMutAct_9fa48("457")) {
            {}
          } else {
            stryCov_9fa48("457");
            return defaultValue;
          }
        }

        // Try to parse as JSON first
        try {
          if (stryMutAct_9fa48("458")) {
            {}
          } else {
            stryCov_9fa48("458");
            return JSON.parse(item);
          }
        } catch {
          if (stryMutAct_9fa48("459")) {
            {}
          } else {
            stryCov_9fa48("459");
            // If JSON.parse fails, it might be a plain string stored directly
            // This can happen if code previously stored values without JSON.stringify
            // Check if it looks like it was meant to be JSON (starts with { or [)
            const looksLikeJson = stryMutAct_9fa48("462") ? item.trim().startsWith('{') && item.trim().startsWith('[') : stryMutAct_9fa48("461") ? false : stryMutAct_9fa48("460") ? true : (stryCov_9fa48("460", "461", "462"), (stryMutAct_9fa48("464") ? item.startsWith('{') : stryMutAct_9fa48("463") ? item.trim().endsWith('{') : (stryCov_9fa48("463", "464"), item.trim().startsWith(stryMutAct_9fa48("465") ? "" : (stryCov_9fa48("465"), '{')))) || (stryMutAct_9fa48("467") ? item.startsWith('[') : stryMutAct_9fa48("466") ? item.trim().endsWith('[') : (stryCov_9fa48("466", "467"), item.trim().startsWith(stryMutAct_9fa48("468") ? "" : (stryCov_9fa48("468"), '[')))));
            if (stryMutAct_9fa48("470") ? false : stryMutAct_9fa48("469") ? true : (stryCov_9fa48("469", "470"), looksLikeJson)) {
              if (stryMutAct_9fa48("471")) {
                {}
              } else {
                stryCov_9fa48("471");
                // Invalid JSON that was meant to be JSON - return default
                logger.warn(stryMutAct_9fa48("472") ? `` : (stryCov_9fa48("472"), `localStorage key "${key}" contains invalid JSON. Returning default value.`), item);
                return defaultValue;
              }
            }

            // Plain string that was stored directly (for backward compatibility)
            // Only return as-is if default is also a string type
            if (stryMutAct_9fa48("475") ? typeof defaultValue === 'string' && defaultValue === null : stryMutAct_9fa48("474") ? false : stryMutAct_9fa48("473") ? true : (stryCov_9fa48("473", "474", "475"), (stryMutAct_9fa48("477") ? typeof defaultValue !== 'string' : stryMutAct_9fa48("476") ? false : (stryCov_9fa48("476", "477"), typeof defaultValue === (stryMutAct_9fa48("478") ? "" : (stryCov_9fa48("478"), 'string')))) || (stryMutAct_9fa48("480") ? defaultValue !== null : stryMutAct_9fa48("479") ? false : (stryCov_9fa48("479", "480"), defaultValue === null)))) {
              if (stryMutAct_9fa48("481")) {
                {}
              } else {
                stryCov_9fa48("481");
                return item as T;
              }
            }

            // For non-string types, return default
            logger.warn(stryMutAct_9fa48("482") ? `` : (stryCov_9fa48("482"), `localStorage key "${key}" contains plain string but expected JSON. Returning default value.`), item);
            return defaultValue;
          }
        }
      }
    } catch (error) {
      if (stryMutAct_9fa48("483")) {
        {}
      } else {
        stryCov_9fa48("483");
        logger.error(stryMutAct_9fa48("484") ? `` : (stryCov_9fa48("484"), `Error reading localStorage key "${key}":`), error);
        return defaultValue;
      }
    }
  }
}

/**
 * Simple localStorage setter with error handling
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
  if (stryMutAct_9fa48("485")) {
    {}
  } else {
    stryCov_9fa48("485");
    if (stryMutAct_9fa48("488") ? typeof window !== 'undefined' : stryMutAct_9fa48("487") ? false : stryMutAct_9fa48("486") ? true : (stryCov_9fa48("486", "487", "488"), typeof window === (stryMutAct_9fa48("489") ? "" : (stryCov_9fa48("489"), 'undefined')))) {
      if (stryMutAct_9fa48("490")) {
        {}
      } else {
        stryCov_9fa48("490");
        return stryMutAct_9fa48("491") ? true : (stryCov_9fa48("491"), false);
      }
    }
    try {
      if (stryMutAct_9fa48("492")) {
        {}
      } else {
        stryCov_9fa48("492");
        window.localStorage.setItem(key, JSON.stringify(value));
        return stryMutAct_9fa48("493") ? false : (stryCov_9fa48("493"), true);
      }
    } catch (error) {
      if (stryMutAct_9fa48("494")) {
        {}
      } else {
        stryCov_9fa48("494");
        logger.error(stryMutAct_9fa48("495") ? `` : (stryCov_9fa48("495"), `Error setting localStorage key "${key}":`), error);
        return stryMutAct_9fa48("496") ? true : (stryCov_9fa48("496"), false);
      }
    }
  }
}

/**
 * Simple localStorage remover with error handling
 */
export function removeLocalStorageItem(key: string): boolean {
  if (stryMutAct_9fa48("497")) {
    {}
  } else {
    stryCov_9fa48("497");
    if (stryMutAct_9fa48("500") ? typeof window !== 'undefined' : stryMutAct_9fa48("499") ? false : stryMutAct_9fa48("498") ? true : (stryCov_9fa48("498", "499", "500"), typeof window === (stryMutAct_9fa48("501") ? "" : (stryCov_9fa48("501"), 'undefined')))) {
      if (stryMutAct_9fa48("502")) {
        {}
      } else {
        stryCov_9fa48("502");
        return stryMutAct_9fa48("503") ? true : (stryCov_9fa48("503"), false);
      }
    }
    try {
      if (stryMutAct_9fa48("504")) {
        {}
      } else {
        stryCov_9fa48("504");
        window.localStorage.removeItem(key);
        return stryMutAct_9fa48("505") ? false : (stryCov_9fa48("505"), true);
      }
    } catch (error) {
      if (stryMutAct_9fa48("506")) {
        {}
      } else {
        stryCov_9fa48("506");
        logger.error(stryMutAct_9fa48("507") ? `` : (stryCov_9fa48("507"), `Error removing localStorage key "${key}":`), error);
        return stryMutAct_9fa48("508") ? true : (stryCov_9fa48("508"), false);
      }
    }
  }
}