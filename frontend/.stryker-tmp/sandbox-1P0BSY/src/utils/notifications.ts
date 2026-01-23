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
  if (stryMutAct_9fa48("827")) {
    {}
  } else {
    stryCov_9fa48("827");
    const {
      duration = 5000,
      type = stryMutAct_9fa48("828") ? "" : (stryCov_9fa48("828"), 'info')
    } = options;
    const colors = stryMutAct_9fa48("829") ? {} : (stryCov_9fa48("829"), {
      success: stryMutAct_9fa48("830") ? {} : (stryCov_9fa48("830"), {
        bg: stryMutAct_9fa48("831") ? "" : (stryCov_9fa48("831"), '#10b981'),
        text: stryMutAct_9fa48("832") ? "" : (stryCov_9fa48("832"), 'white')
      }),
      error: stryMutAct_9fa48("833") ? {} : (stryCov_9fa48("833"), {
        bg: stryMutAct_9fa48("834") ? "" : (stryCov_9fa48("834"), '#ef4444'),
        text: stryMutAct_9fa48("835") ? "" : (stryCov_9fa48("835"), 'white')
      }),
      info: stryMutAct_9fa48("836") ? {} : (stryCov_9fa48("836"), {
        bg: stryMutAct_9fa48("837") ? "" : (stryCov_9fa48("837"), '#3b82f6'),
        text: stryMutAct_9fa48("838") ? "" : (stryCov_9fa48("838"), 'white')
      }),
      warning: stryMutAct_9fa48("839") ? {} : (stryCov_9fa48("839"), {
        bg: stryMutAct_9fa48("840") ? "" : (stryCov_9fa48("840"), '#f59e0b'),
        text: stryMutAct_9fa48("841") ? "" : (stryCov_9fa48("841"), 'white')
      })
    });
    const color = colors[type];
    const notification = document.createElement(stryMutAct_9fa48("842") ? "" : (stryCov_9fa48("842"), 'div'));
    notification.style.cssText = stryMutAct_9fa48("843") ? `` : (stryCov_9fa48("843"), `
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
    if (stryMutAct_9fa48("846") ? false : stryMutAct_9fa48("845") ? true : stryMutAct_9fa48("844") ? document.getElementById('notification-styles') : (stryCov_9fa48("844", "845", "846"), !document.getElementById(stryMutAct_9fa48("847") ? "" : (stryCov_9fa48("847"), 'notification-styles')))) {
      if (stryMutAct_9fa48("848")) {
        {}
      } else {
        stryCov_9fa48("848");
        const style = document.createElement(stryMutAct_9fa48("849") ? "" : (stryCov_9fa48("849"), 'style'));
        style.id = stryMutAct_9fa48("850") ? "" : (stryCov_9fa48("850"), 'notification-styles');
        style.textContent = stryMutAct_9fa48("851") ? `` : (stryCov_9fa48("851"), `
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
      if (stryMutAct_9fa48("852")) {
        {}
      } else {
        stryCov_9fa48("852");
        notification.style.transition = stryMutAct_9fa48("853") ? "" : (stryCov_9fa48("853"), 'opacity 0.3s, transform 0.3s');
        notification.style.opacity = stryMutAct_9fa48("854") ? "" : (stryCov_9fa48("854"), '0');
        notification.style.transform = stryMutAct_9fa48("855") ? "" : (stryCov_9fa48("855"), 'translateX(100%)');
        setTimeout(stryMutAct_9fa48("856") ? () => undefined : (stryCov_9fa48("856"), () => notification.remove()), 300);
      }
    }, duration);
    return notification;
  }
}

/**
 * Show a success notification
 */
export function showSuccess(message: string, duration?: number) {
  if (stryMutAct_9fa48("857")) {
    {}
  } else {
    stryCov_9fa48("857");
    return showNotification(message, stryMutAct_9fa48("858") ? {} : (stryCov_9fa48("858"), {
      type: stryMutAct_9fa48("859") ? "" : (stryCov_9fa48("859"), 'success'),
      duration
    }));
  }
}

/**
 * Show an error notification
 */
export function showError(message: string, duration?: number) {
  if (stryMutAct_9fa48("860")) {
    {}
  } else {
    stryCov_9fa48("860");
    return showNotification(message, stryMutAct_9fa48("861") ? {} : (stryCov_9fa48("861"), {
      type: stryMutAct_9fa48("862") ? "" : (stryCov_9fa48("862"), 'error'),
      duration
    }));
  }
}

/**
 * Show an info notification
 */
export function showInfo(message: string, duration?: number) {
  if (stryMutAct_9fa48("863")) {
    {}
  } else {
    stryCov_9fa48("863");
    return showNotification(message, stryMutAct_9fa48("864") ? {} : (stryCov_9fa48("864"), {
      type: stryMutAct_9fa48("865") ? "" : (stryCov_9fa48("865"), 'info'),
      duration
    }));
  }
}

/**
 * Show a warning notification
 */
export function showWarning(message: string, duration?: number) {
  if (stryMutAct_9fa48("866")) {
    {}
  } else {
    stryCov_9fa48("866");
    return showNotification(message, stryMutAct_9fa48("867") ? {} : (stryCov_9fa48("867"), {
      type: stryMutAct_9fa48("868") ? "" : (stryCov_9fa48("868"), 'warning'),
      duration
    }));
  }
}