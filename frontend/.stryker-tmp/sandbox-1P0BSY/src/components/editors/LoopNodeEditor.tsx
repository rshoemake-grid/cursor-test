/**
 * Loop Node Editor Component
 * Handles editing of loop node properties
 * Follows Single Responsibility Principle
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
import { useRef, useState, useEffect } from 'react';
import { NodeWithData } from '../../types/nodeData';
interface LoopNodeEditorProps {
  node: NodeWithData & {
    type: 'loop';
  };
  onUpdate: (field: string, value: unknown) => void;
  onConfigUpdate: (configField: string, field: string, value: unknown) => void;
}
export default function LoopNodeEditor({
  node,
  onUpdate,
  onConfigUpdate
}: LoopNodeEditorProps) {
  if (stryMutAct_9fa48("368")) {
    {}
  } else {
    stryCov_9fa48("368");
    const loopMaxIterationsRef = useRef<HTMLInputElement>(null);
    const [loopMaxIterationsValue, setLoopMaxIterationsValue] = useState<number>(10);

    // Sync local state with node data
    useEffect(() => {
      if (stryMutAct_9fa48("369")) {
        {}
      } else {
        stryCov_9fa48("369");
        const loopConfig = stryMutAct_9fa48("372") ? node.data.loop_config && {} : stryMutAct_9fa48("371") ? false : stryMutAct_9fa48("370") ? true : (stryCov_9fa48("370", "371", "372"), node.data.loop_config || {});
        if (stryMutAct_9fa48("375") ? document.activeElement === loopMaxIterationsRef.current : stryMutAct_9fa48("374") ? false : stryMutAct_9fa48("373") ? true : (stryCov_9fa48("373", "374", "375"), document.activeElement !== loopMaxIterationsRef.current)) {
          if (stryMutAct_9fa48("376")) {
            {}
          } else {
            stryCov_9fa48("376");
            setLoopMaxIterationsValue(stryMutAct_9fa48("377") ? loopConfig.max_iterations && 0 : (stryCov_9fa48("377"), loopConfig.max_iterations ?? 0));
          }
        }
      }
    }, stryMutAct_9fa48("378") ? [] : (stryCov_9fa48("378"), [node.data.loop_config]));
    const loopConfig = stryMutAct_9fa48("381") ? node.data.loop_config && {} : stryMutAct_9fa48("380") ? false : stryMutAct_9fa48("379") ? true : (stryCov_9fa48("379", "380", "381"), node.data.loop_config || {});
    const loopType = stryMutAct_9fa48("384") ? loopConfig.loop_type && 'for_each' : stryMutAct_9fa48("383") ? false : stryMutAct_9fa48("382") ? true : (stryCov_9fa48("382", "383", "384"), loopConfig.loop_type || (stryMutAct_9fa48("385") ? "" : (stryCov_9fa48("385"), 'for_each')));
    return <>
      {/* Loop Type */}
      <div>
        <label htmlFor="loop-type" className="block text-sm font-medium text-gray-700 mb-1">
          Loop Type
        </label>
        <select id="loop-type" value={loopType} onChange={e => {
          if (stryMutAct_9fa48("386")) {
            {}
          } else {
            stryCov_9fa48("386");
            const currentLoopConfig = loopConfig;
            onUpdate(stryMutAct_9fa48("387") ? "" : (stryCov_9fa48("387"), 'loop_config'), stryMutAct_9fa48("388") ? {} : (stryCov_9fa48("388"), {
              loop_type: e.target.value,
              max_iterations: stryMutAct_9fa48("389") ? currentLoopConfig.max_iterations && 0 : (stryCov_9fa48("389"), currentLoopConfig.max_iterations ?? 0),
              items_source: currentLoopConfig.items_source,
              condition: currentLoopConfig.condition
            }));
          }
        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select loop type">
          <option value="for_each">For Each</option>
          <option value="while">While</option>
          <option value="until">Until</option>
        </select>
      </div>

      {/* Max Iterations */}
      <div className="mt-4">
        <label htmlFor="loop-max-iterations" className="block text-sm font-medium text-gray-700 mb-1">
          Max Iterations
        </label>
        <input id="loop-max-iterations" ref={loopMaxIterationsRef} type="number" min="0" value={loopMaxIterationsValue} onChange={e => {
          if (stryMutAct_9fa48("390")) {
            {}
          } else {
            stryCov_9fa48("390");
            const newValue = stryMutAct_9fa48("393") ? parseInt(e.target.value) && 0 : stryMutAct_9fa48("392") ? false : stryMutAct_9fa48("391") ? true : (stryCov_9fa48("391", "392", "393"), parseInt(e.target.value) || 0);
            setLoopMaxIterationsValue(newValue);
            onConfigUpdate(stryMutAct_9fa48("394") ? "" : (stryCov_9fa48("394"), 'loop_config'), stryMutAct_9fa48("395") ? "" : (stryCov_9fa48("395"), 'max_iterations'), newValue);
          }
        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Maximum number of loop iterations" aria-describedby="max-iterations-help" />
        <p id="max-iterations-help" className="text-xs text-gray-500 mt-1">
          Maximum number of times the loop will execute (0 = unlimited)
        </p>
      </div>
    </>;
  }
}