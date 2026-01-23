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
  if (stryMutAct_9fa48("693")) {
    {}
  } else {
    stryCov_9fa48("693");
    const {
      title = stryMutAct_9fa48("694") ? "" : (stryCov_9fa48("694"), 'Confirm'),
      confirmText = stryMutAct_9fa48("695") ? "" : (stryCov_9fa48("695"), 'Confirm'),
      cancelText = stryMutAct_9fa48("696") ? "" : (stryCov_9fa48("696"), 'Cancel'),
      type = stryMutAct_9fa48("697") ? "" : (stryCov_9fa48("697"), 'warning')
    } = options;
    return new Promise(resolve => {
      if (stryMutAct_9fa48("698")) {
        {}
      } else {
        stryCov_9fa48("698");
        // Create overlay
        const overlay = document.createElement(stryMutAct_9fa48("699") ? "" : (stryCov_9fa48("699"), 'div'));
        overlay.style.cssText = stryMutAct_9fa48("700") ? `` : (stryCov_9fa48("700"), `
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
        const dialog = document.createElement(stryMutAct_9fa48("701") ? "" : (stryCov_9fa48("701"), 'div'));
        dialog.style.cssText = stryMutAct_9fa48("702") ? `` : (stryCov_9fa48("702"), `
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
        if (stryMutAct_9fa48("705") ? false : stryMutAct_9fa48("704") ? true : stryMutAct_9fa48("703") ? document.getElementById('confirm-dialog-styles') : (stryCov_9fa48("703", "704", "705"), !document.getElementById(stryMutAct_9fa48("706") ? "" : (stryCov_9fa48("706"), 'confirm-dialog-styles')))) {
          if (stryMutAct_9fa48("707")) {
            {}
          } else {
            stryCov_9fa48("707");
            const style = document.createElement(stryMutAct_9fa48("708") ? "" : (stryCov_9fa48("708"), 'style'));
            style.id = stryMutAct_9fa48("709") ? "" : (stryCov_9fa48("709"), 'confirm-dialog-styles');
            style.textContent = stryMutAct_9fa48("710") ? `` : (stryCov_9fa48("710"), `
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
        const titleEl = document.createElement(stryMutAct_9fa48("711") ? "" : (stryCov_9fa48("711"), 'h3'));
        titleEl.textContent = title;
        titleEl.style.cssText = stryMutAct_9fa48("712") ? `` : (stryCov_9fa48("712"), `
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    `);
        dialog.appendChild(titleEl);

        // Message
        const messageEl = document.createElement(stryMutAct_9fa48("713") ? "" : (stryCov_9fa48("713"), 'p'));
        messageEl.textContent = message;
        messageEl.style.cssText = stryMutAct_9fa48("714") ? `` : (stryCov_9fa48("714"), `
      margin: 0 0 24px 0;
      color: #4b5563;
      line-height: 1.5;
      white-space: pre-line;
    `);
        dialog.appendChild(messageEl);

        // Buttons container
        const buttonsContainer = document.createElement(stryMutAct_9fa48("715") ? "" : (stryCov_9fa48("715"), 'div'));
        buttonsContainer.style.cssText = stryMutAct_9fa48("716") ? `` : (stryCov_9fa48("716"), `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `);
        dialog.appendChild(buttonsContainer);

        // Cancel button
        const cancelBtn = document.createElement(stryMutAct_9fa48("717") ? "" : (stryCov_9fa48("717"), 'button'));
        cancelBtn.textContent = cancelText;
        cancelBtn.style.cssText = stryMutAct_9fa48("718") ? `` : (stryCov_9fa48("718"), `
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
          if (stryMutAct_9fa48("719")) {
            {}
          } else {
            stryCov_9fa48("719");
            cancelBtn.style.background = stryMutAct_9fa48("720") ? "" : (stryCov_9fa48("720"), '#f9fafb');
          }
        };
        cancelBtn.onmouseout = () => {
          if (stryMutAct_9fa48("721")) {
            {}
          } else {
            stryCov_9fa48("721");
            cancelBtn.style.background = stryMutAct_9fa48("722") ? "" : (stryCov_9fa48("722"), 'white');
          }
        };
        cancelBtn.onclick = () => {
          if (stryMutAct_9fa48("723")) {
            {}
          } else {
            stryCov_9fa48("723");
            overlay.remove();
            resolve(stryMutAct_9fa48("724") ? true : (stryCov_9fa48("724"), false));
          }
        };
        buttonsContainer.appendChild(cancelBtn);

        // Confirm button
        const confirmBtn = document.createElement(stryMutAct_9fa48("725") ? "" : (stryCov_9fa48("725"), 'button'));
        confirmBtn.textContent = confirmText;
        const confirmColors = stryMutAct_9fa48("726") ? {} : (stryCov_9fa48("726"), {
          warning: stryMutAct_9fa48("727") ? {} : (stryCov_9fa48("727"), {
            bg: stryMutAct_9fa48("728") ? "" : (stryCov_9fa48("728"), '#f59e0b'),
            hover: stryMutAct_9fa48("729") ? "" : (stryCov_9fa48("729"), '#d97706')
          }),
          danger: stryMutAct_9fa48("730") ? {} : (stryCov_9fa48("730"), {
            bg: stryMutAct_9fa48("731") ? "" : (stryCov_9fa48("731"), '#ef4444'),
            hover: stryMutAct_9fa48("732") ? "" : (stryCov_9fa48("732"), '#dc2626')
          }),
          info: stryMutAct_9fa48("733") ? {} : (stryCov_9fa48("733"), {
            bg: stryMutAct_9fa48("734") ? "" : (stryCov_9fa48("734"), '#3b82f6'),
            hover: stryMutAct_9fa48("735") ? "" : (stryCov_9fa48("735"), '#2563eb')
          })
        });
        const colors = confirmColors[type];
        confirmBtn.style.cssText = stryMutAct_9fa48("736") ? `` : (stryCov_9fa48("736"), `
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
          if (stryMutAct_9fa48("737")) {
            {}
          } else {
            stryCov_9fa48("737");
            confirmBtn.style.background = colors.hover;
          }
        };
        confirmBtn.onmouseout = () => {
          if (stryMutAct_9fa48("738")) {
            {}
          } else {
            stryCov_9fa48("738");
            confirmBtn.style.background = colors.bg;
          }
        };
        confirmBtn.onclick = () => {
          if (stryMutAct_9fa48("739")) {
            {}
          } else {
            stryCov_9fa48("739");
            overlay.remove();
            resolve(stryMutAct_9fa48("740") ? false : (stryCov_9fa48("740"), true));
          }
        };
        buttonsContainer.appendChild(confirmBtn);

        // Close on overlay click
        overlay.onclick = e => {
          if (stryMutAct_9fa48("741")) {
            {}
          } else {
            stryCov_9fa48("741");
            if (stryMutAct_9fa48("744") ? e.target !== overlay : stryMutAct_9fa48("743") ? false : stryMutAct_9fa48("742") ? true : (stryCov_9fa48("742", "743", "744"), e.target === overlay)) {
              if (stryMutAct_9fa48("745")) {
                {}
              } else {
                stryCov_9fa48("745");
                overlay.remove();
                resolve(stryMutAct_9fa48("746") ? true : (stryCov_9fa48("746"), false));
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