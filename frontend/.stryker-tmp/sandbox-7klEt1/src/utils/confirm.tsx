/**
 * Show a confirmation dialog (non-blocking, promise-based)
 * Returns a promise that resolves to true if confirmed, false if cancelled
 */
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
export function showConfirm(message: string, options: {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
} = {}): Promise<boolean> {
  if (stryMutAct_9fa48("834")) {
    {}
  } else {
    stryCov_9fa48("834");
    const {
      title = stryMutAct_9fa48("835") ? "" : (stryCov_9fa48("835"), 'Confirm'),
      confirmText = stryMutAct_9fa48("836") ? "" : (stryCov_9fa48("836"), 'Confirm'),
      cancelText = stryMutAct_9fa48("837") ? "" : (stryCov_9fa48("837"), 'Cancel'),
      type = stryMutAct_9fa48("838") ? "" : (stryCov_9fa48("838"), 'warning')
    } = options;
    return new Promise(resolve => {
      if (stryMutAct_9fa48("839")) {
        {}
      } else {
        stryCov_9fa48("839");
        // Create overlay
        const overlay = document.createElement(stryMutAct_9fa48("840") ? "" : (stryCov_9fa48("840"), 'div'));
        overlay.style.cssText = stryMutAct_9fa48("841") ? `` : (stryCov_9fa48("841"), `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    `);

        // Create dialog
        const dialog = document.createElement(stryMutAct_9fa48("842") ? "" : (stryCov_9fa48("842"), 'div'));
        dialog.style.cssText = stryMutAct_9fa48("843") ? `` : (stryCov_9fa48("843"), `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
    `);

        // Add animation styles if not already added
        if (stryMutAct_9fa48("846") ? false : stryMutAct_9fa48("845") ? true : stryMutAct_9fa48("844") ? document.getElementById('confirm-dialog-styles') : (stryCov_9fa48("844", "845", "846"), !document.getElementById(stryMutAct_9fa48("847") ? "" : (stryCov_9fa48("847"), 'confirm-dialog-styles')))) {
          if (stryMutAct_9fa48("848")) {
            {}
          } else {
            stryCov_9fa48("848");
            const style = document.createElement(stryMutAct_9fa48("849") ? "" : (stryCov_9fa48("849"), 'style'));
            style.id = stryMutAct_9fa48("850") ? "" : (stryCov_9fa48("850"), 'confirm-dialog-styles');
            style.textContent = stryMutAct_9fa48("851") ? `` : (stryCov_9fa48("851"), `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `);
            document.head.appendChild(style);
          }
        }

        // Title
        const titleEl = document.createElement(stryMutAct_9fa48("852") ? "" : (stryCov_9fa48("852"), 'h3'));
        titleEl.textContent = title;
        titleEl.style.cssText = stryMutAct_9fa48("853") ? `` : (stryCov_9fa48("853"), `
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    `);
        dialog.appendChild(titleEl);

        // Message
        const messageEl = document.createElement(stryMutAct_9fa48("854") ? "" : (stryCov_9fa48("854"), 'p'));
        messageEl.textContent = message;
        messageEl.style.cssText = stryMutAct_9fa48("855") ? `` : (stryCov_9fa48("855"), `
      margin: 0 0 24px 0;
      color: #4b5563;
      line-height: 1.5;
      white-space: pre-line;
    `);
        dialog.appendChild(messageEl);

        // Buttons container
        const buttonsContainer = document.createElement(stryMutAct_9fa48("856") ? "" : (stryCov_9fa48("856"), 'div'));
        buttonsContainer.style.cssText = stryMutAct_9fa48("857") ? `` : (stryCov_9fa48("857"), `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `);
        dialog.appendChild(buttonsContainer);

        // Cancel button
        const cancelBtn = document.createElement(stryMutAct_9fa48("858") ? "" : (stryCov_9fa48("858"), 'button'));
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = stryMutAct_9fa48("859") ? `` : (stryCov_9fa48("859"), `
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    `);
        cancelBtn.onmouseover = () => {
          if (stryMutAct_9fa48("860")) {
            {}
          } else {
            stryCov_9fa48("860");
            cancelBtn.style.background = stryMutAct_9fa48("861") ? "" : (stryCov_9fa48("861"), '#f9fafb');
          }
        };
        cancelBtn.onmouseout = () => {
          if (stryMutAct_9fa48("862")) {
            {}
          } else {
            stryCov_9fa48("862");
            cancelBtn.style.background = stryMutAct_9fa48("863") ? "" : (stryCov_9fa48("863"), 'white');
          }
        };
        cancelBtn.onclick = () => {
          if (stryMutAct_9fa48("864")) {
            {}
          } else {
            stryCov_9fa48("864");
            overlay.remove();
            resolve(stryMutAct_9fa48("865") ? true : (stryCov_9fa48("865"), false));
          }
        };
        buttonsContainer.appendChild(cancelBtn);

        // Confirm button
        const confirmBtn = document.createElement(stryMutAct_9fa48("866") ? "" : (stryCov_9fa48("866"), 'button'));
        confirmBtn.textContent = confirmText;
        const confirmColors = stryMutAct_9fa48("867") ? {} : (stryCov_9fa48("867"), {
          warning: stryMutAct_9fa48("868") ? {} : (stryCov_9fa48("868"), {
            bg: stryMutAct_9fa48("869") ? "" : (stryCov_9fa48("869"), '#f59e0b'),
            hover: stryMutAct_9fa48("870") ? "" : (stryCov_9fa48("870"), '#d97706')
          }),
          danger: stryMutAct_9fa48("871") ? {} : (stryCov_9fa48("871"), {
            bg: stryMutAct_9fa48("872") ? "" : (stryCov_9fa48("872"), '#ef4444'),
            hover: stryMutAct_9fa48("873") ? "" : (stryCov_9fa48("873"), '#dc2626')
          }),
          info: stryMutAct_9fa48("874") ? {} : (stryCov_9fa48("874"), {
            bg: stryMutAct_9fa48("875") ? "" : (stryCov_9fa48("875"), '#3b82f6'),
            hover: stryMutAct_9fa48("876") ? "" : (stryCov_9fa48("876"), '#2563eb')
          })
        });
        const colors = confirmColors[type];
        confirmBtn.style.cssText = stryMutAct_9fa48("877") ? `` : (stryCov_9fa48("877"), `
      padding: 8px 16px;
      border: none;
      background: ${colors.bg};
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    `);
        confirmBtn.onmouseover = () => {
          if (stryMutAct_9fa48("878")) {
            {}
          } else {
            stryCov_9fa48("878");
            confirmBtn.style.background = colors.hover;
          }
        };
        confirmBtn.onmouseout = () => {
          if (stryMutAct_9fa48("879")) {
            {}
          } else {
            stryCov_9fa48("879");
            confirmBtn.style.background = colors.bg;
          }
        };
        confirmBtn.onclick = () => {
          if (stryMutAct_9fa48("880")) {
            {}
          } else {
            stryCov_9fa48("880");
            overlay.remove();
            resolve(stryMutAct_9fa48("881") ? false : (stryCov_9fa48("881"), true));
          }
        };
        buttonsContainer.appendChild(confirmBtn);

        // Close on overlay click
        overlay.onclick = e => {
          if (stryMutAct_9fa48("882")) {
            {}
          } else {
            stryCov_9fa48("882");
            if (stryMutAct_9fa48("885") ? e.target !== overlay : stryMutAct_9fa48("884") ? false : stryMutAct_9fa48("883") ? true : (stryCov_9fa48("883", "884", "885"), e.target === overlay)) {
              if (stryMutAct_9fa48("886")) {
                {}
              } else {
                stryCov_9fa48("886");
                overlay.remove();
                resolve(stryMutAct_9fa48("887") ? true : (stryCov_9fa48("887"), false));
              }
            }
          }
        };

        // Add to DOM
        dialog.appendChild(buttonsContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Focus confirm button
        confirmBtn.focus();
      }
    });
  }
}