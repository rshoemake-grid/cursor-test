/**
 * Condition Node Editor Component
 * Handles editing of condition node properties
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
interface ConditionNodeEditorProps {
  node: NodeWithData & {
    type: 'condition';
  };
  onConfigUpdate: (configField: string, field: string, value: unknown) => void;
}
export default function ConditionNodeEditor({
  node,
  onConfigUpdate
}: ConditionNodeEditorProps) {
  if (stryMutAct_9fa48("84")) {
    {}
  } else {
    stryCov_9fa48("84");
    const conditionFieldRef = useRef<HTMLInputElement>(null);
    const conditionValueRef = useRef<HTMLInputElement>(null);
    const [conditionFieldValue, setConditionFieldValue] = useState(stryMutAct_9fa48("85") ? "Stryker was here!" : (stryCov_9fa48("85"), ''));
    const [conditionValueValue, setConditionValueValue] = useState(stryMutAct_9fa48("86") ? "Stryker was here!" : (stryCov_9fa48("86"), ''));

    // Sync local state with node data
    useEffect(() => {
      if (stryMutAct_9fa48("87")) {
        {}
      } else {
        stryCov_9fa48("87");
        const conditionConfig = stryMutAct_9fa48("90") ? node.data.condition_config && {} : stryMutAct_9fa48("89") ? false : stryMutAct_9fa48("88") ? true : (stryCov_9fa48("88", "89", "90"), node.data.condition_config || {});
        if (stryMutAct_9fa48("93") ? document.activeElement === conditionFieldRef.current : stryMutAct_9fa48("92") ? false : stryMutAct_9fa48("91") ? true : (stryCov_9fa48("91", "92", "93"), document.activeElement !== conditionFieldRef.current)) {
          if (stryMutAct_9fa48("94")) {
            {}
          } else {
            stryCov_9fa48("94");
            setConditionFieldValue(stryMutAct_9fa48("97") ? conditionConfig.field && '' : stryMutAct_9fa48("96") ? false : stryMutAct_9fa48("95") ? true : (stryCov_9fa48("95", "96", "97"), conditionConfig.field || (stryMutAct_9fa48("98") ? "Stryker was here!" : (stryCov_9fa48("98"), ''))));
          }
        }
        if (stryMutAct_9fa48("101") ? document.activeElement === conditionValueRef.current : stryMutAct_9fa48("100") ? false : stryMutAct_9fa48("99") ? true : (stryCov_9fa48("99", "100", "101"), document.activeElement !== conditionValueRef.current)) {
          if (stryMutAct_9fa48("102")) {
            {}
          } else {
            stryCov_9fa48("102");
            setConditionValueValue(stryMutAct_9fa48("105") ? conditionConfig.value && '' : stryMutAct_9fa48("104") ? false : stryMutAct_9fa48("103") ? true : (stryCov_9fa48("103", "104", "105"), conditionConfig.value || (stryMutAct_9fa48("106") ? "Stryker was here!" : (stryCov_9fa48("106"), ''))));
          }
        }
      }
    }, stryMutAct_9fa48("107") ? [] : (stryCov_9fa48("107"), [node.data.condition_config]));
    const conditionConfig = stryMutAct_9fa48("110") ? node.data.condition_config && {} : stryMutAct_9fa48("109") ? false : stryMutAct_9fa48("108") ? true : (stryCov_9fa48("108", "109", "110"), node.data.condition_config || {});
    const conditionType = stryMutAct_9fa48("113") ? conditionConfig.condition_type && 'equals' : stryMutAct_9fa48("112") ? false : stryMutAct_9fa48("111") ? true : (stryCov_9fa48("111", "112", "113"), conditionConfig.condition_type || (stryMutAct_9fa48("114") ? "" : (stryCov_9fa48("114"), 'equals')));
    const showValueField = stryMutAct_9fa48("117") ? conditionType !== 'empty' || conditionType !== 'not_empty' : stryMutAct_9fa48("116") ? false : stryMutAct_9fa48("115") ? true : (stryCov_9fa48("115", "116", "117"), (stryMutAct_9fa48("119") ? conditionType === 'empty' : stryMutAct_9fa48("118") ? true : (stryCov_9fa48("118", "119"), conditionType !== (stryMutAct_9fa48("120") ? "" : (stryCov_9fa48("120"), 'empty')))) && (stryMutAct_9fa48("122") ? conditionType === 'not_empty' : stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121", "122"), conditionType !== (stryMutAct_9fa48("123") ? "" : (stryCov_9fa48("123"), 'not_empty')))));
    return <>
      {/* Condition Type */}
      <div>
        <label htmlFor="condition-type" className="block text-sm font-medium text-gray-700 mb-1">
          Condition Type
        </label>
        <select id="condition-type" value={conditionType} onChange={stryMutAct_9fa48("124") ? () => undefined : (stryCov_9fa48("124"), e => onConfigUpdate(stryMutAct_9fa48("125") ? "" : (stryCov_9fa48("125"), 'condition_config'), stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), 'condition_type'), e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select condition type">
          <option value="equals">Equals</option>
          <option value="not_equals">Not Equals</option>
          <option value="contains">Contains</option>
          <option value="not_contains">Not Contains</option>
          <option value="greater_than">Greater Than</option>
          <option value="not_greater_than">Not Greater Than</option>
          <option value="less_than">Less Than</option>
          <option value="not_less_than">Not Less Than</option>
          <option value="empty">Empty</option>
          <option value="not_empty">Not Empty</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Field */}
      <div className="mt-4">
        <label htmlFor="condition-field" className="block text-sm font-medium text-gray-700 mb-1">
          Field
        </label>
        <input id="condition-field" ref={conditionFieldRef} type="text" value={conditionFieldValue} onChange={e => {
          if (stryMutAct_9fa48("127")) {
            {}
          } else {
            stryCov_9fa48("127");
            const newValue = e.target.value;
            setConditionFieldValue(newValue);
            onConfigUpdate(stryMutAct_9fa48("128") ? "" : (stryCov_9fa48("128"), 'condition_config'), stryMutAct_9fa48("129") ? "" : (stryCov_9fa48("129"), 'field'), newValue);
          }
        }} placeholder="Field to check" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Field name to check in condition" />
      </div>

      {/* Value (conditional) */}
      {stryMutAct_9fa48("132") ? showValueField || <div className="mt-4">
          <label htmlFor="condition-value" className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <input id="condition-value" ref={conditionValueRef} type="text" value={conditionValueValue} onChange={e => {
          const newValue = e.target.value;
          setConditionValueValue(newValue);
          onConfigUpdate('condition_config', 'value', newValue);
        }} placeholder="Value to compare" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Value to compare against field" />
        </div> : stryMutAct_9fa48("131") ? false : stryMutAct_9fa48("130") ? true : (stryCov_9fa48("130", "131", "132"), showValueField && <div className="mt-4">
          <label htmlFor="condition-value" className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <input id="condition-value" ref={conditionValueRef} type="text" value={conditionValueValue} onChange={e => {
          if (stryMutAct_9fa48("133")) {
            {}
          } else {
            stryCov_9fa48("133");
            const newValue = e.target.value;
            setConditionValueValue(newValue);
            onConfigUpdate(stryMutAct_9fa48("134") ? "" : (stryCov_9fa48("134"), 'condition_config'), stryMutAct_9fa48("135") ? "" : (stryCov_9fa48("135"), 'value'), newValue);
          }
        }} placeholder="Value to compare" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Value to compare against field" />
        </div>)}
    </>;
  }
}