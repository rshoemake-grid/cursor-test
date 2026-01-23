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
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export interface NotificationOptions {
  duration?: number; // milliseconds, default 5000
  type?: NotificationType; // default 'info'
}

/**
 * Show a non-blocking notification toast
 */
export function showNotification(message: string, options: NotificationOptions = {}) {
  if (stryMutAct_9fa48("968")) {
    {}
  } else {
    stryCov_9fa48("968");
    const {
      duration = 5000,
      type = stryMutAct_9fa48("969") ? "" : (stryCov_9fa48("969"), 'info')
    } = options;
    const colors = stryMutAct_9fa48("970") ? {} : (stryCov_9fa48("970"), {
      success: stryMutAct_9fa48("971") ? {} : (stryCov_9fa48("971"), {
        bg: stryMutAct_9fa48("972") ? "" : (stryCov_9fa48("972"), '#10b981'),
        text: stryMutAct_9fa48("973") ? "" : (stryCov_9fa48("973"), 'white')
      }),
      error: stryMutAct_9fa48("974") ? {} : (stryCov_9fa48("974"), {
        bg: stryMutAct_9fa48("975") ? "" : (stryCov_9fa48("975"), '#ef4444'),
        text: stryMutAct_9fa48("976") ? "" : (stryCov_9fa48("976"), 'white')
      }),
      info: stryMutAct_9fa48("977") ? {} : (stryCov_9fa48("977"), {
        bg: stryMutAct_9fa48("978") ? "" : (stryCov_9fa48("978"), '#3b82f6'),
        text: stryMutAct_9fa48("979") ? "" : (stryCov_9fa48("979"), 'white')
      }),
      warning: stryMutAct_9fa48("980") ? {} : (stryCov_9fa48("980"), {
        bg: stryMutAct_9fa48("981") ? "" : (stryCov_9fa48("981"), '#f59e0b'),
        text: stryMutAct_9fa48("982") ? "" : (stryCov_9fa48("982"), 'white')
      })
    });
    const color = colors[type];
    const notification = document.createElement(stryMutAct_9fa48("983") ? "" : (stryCov_9fa48("983"), 'div'));
    notification.style.cssText = stryMutAct_9fa48("984") ? `` : (stryCov_9fa48("984"), `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${color.bg};
    color: ${color.text};
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    max-width: 400px;
    white-space: pre-line;
    font-family: system-ui, -apple-system, sans-serif;
    animation: slideIn 0.3s ease-out;
  `);

    // Add animation keyframes if not already added
    if (stryMutAct_9fa48("987") ? false : stryMutAct_9fa48("986") ? true : stryMutAct_9fa48("985") ? document.getElementById('notification-styles') : (stryCov_9fa48("985", "986", "987"), !document.getElementById(stryMutAct_9fa48("988") ? "" : (stryCov_9fa48("988"), 'notification-styles')))) {
      if (stryMutAct_9fa48("989")) {
        {}
      } else {
        stryCov_9fa48("989");
        const style = document.createElement(stryMutAct_9fa48("990") ? "" : (stryCov_9fa48("990"), 'style'));
        style.id = stryMutAct_9fa48("991") ? "" : (stryCov_9fa48("991"), 'notification-styles');
        style.textContent = stryMutAct_9fa48("992") ? `` : (stryCov_9fa48("992"), `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `);
        document.head.appendChild(style);
      }
    }
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
      if (stryMutAct_9fa48("993")) {
        {}
      } else {
        stryCov_9fa48("993");
        notification.style.transition = stryMutAct_9fa48("994") ? "" : (stryCov_9fa48("994"), 'opacity 0.3s, transform 0.3s');
        notification.style.opacity = stryMutAct_9fa48("995") ? "" : (stryCov_9fa48("995"), '0');
        notification.style.transform = stryMutAct_9fa48("996") ? "" : (stryCov_9fa48("996"), 'translateX(100%)');
        setTimeout(stryMutAct_9fa48("997") ? () => undefined : (stryCov_9fa48("997"), () => notification.remove()), 300);
      }
    }, duration);
    return notification;
  }
}

/**
 * Show a success notification
 */
export function showSuccess(message: string, duration?: number) {
  if (stryMutAct_9fa48("998")) {
    {}
  } else {
    stryCov_9fa48("998");
    return showNotification(message, stryMutAct_9fa48("999") ? {} : (stryCov_9fa48("999"), {
      type: stryMutAct_9fa48("1000") ? "" : (stryCov_9fa48("1000"), 'success'),
      duration
    }));
  }
}

/**
 * Show an error notification
 */
export function showError(message: string, duration?: number) {
  if (stryMutAct_9fa48("1001")) {
    {}
  } else {
    stryCov_9fa48("1001");
    return showNotification(message, stryMutAct_9fa48("1002") ? {} : (stryCov_9fa48("1002"), {
      type: stryMutAct_9fa48("1003") ? "" : (stryCov_9fa48("1003"), 'error'),
      duration
    }));
  }
}

/**
 * Show an info notification
 */
export function showInfo(message: string, duration?: number) {
  if (stryMutAct_9fa48("1004")) {
    {}
  } else {
    stryCov_9fa48("1004");
    return showNotification(message, stryMutAct_9fa48("1005") ? {} : (stryCov_9fa48("1005"), {
      type: stryMutAct_9fa48("1006") ? "" : (stryCov_9fa48("1006"), 'info'),
      duration
    }));
  }
}

/**
 * Show a warning notification
 */
export function showWarning(message: string, duration?: number) {
  if (stryMutAct_9fa48("1007")) {
    {}
  } else {
    stryCov_9fa48("1007");
    return showNotification(message, stryMutAct_9fa48("1008") ? {} : (stryCov_9fa48("1008"), {
      type: stryMutAct_9fa48("1009") ? "" : (stryCov_9fa48("1009"), 'warning'),
      duration
    }));
  }
}