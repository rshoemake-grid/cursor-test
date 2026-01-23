/**
 * Agent Node Editor Component
 * Handles editing of LLM agent node properties
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
interface AgentNodeEditorProps {
  node: NodeWithData & {
    type: 'agent';
  };
  availableModels: Array<{
    value: string;
    label: string;
    provider: string;
  }>;
  onUpdate: (field: string, value: unknown) => void;
  onConfigUpdate: (configField: string, field: string, value: unknown) => void;
}
export default function AgentNodeEditor({
  node,
  availableModels,
  onUpdate,
  onConfigUpdate
}: AgentNodeEditorProps) {
  if (stryMutAct_9fa48("15")) {
    {}
  } else {
    stryCov_9fa48("15");
    const systemPromptRef = useRef<HTMLTextAreaElement>(null);
    const maxTokensRef = useRef<HTMLInputElement>(null);
    const [systemPromptValue, setSystemPromptValue] = useState(stryMutAct_9fa48("16") ? "Stryker was here!" : (stryCov_9fa48("16"), ''));
    const [maxTokensValue, setMaxTokensValue] = useState<string | number>(stryMutAct_9fa48("17") ? "Stryker was here!" : (stryCov_9fa48("17"), ''));

    // Sync local state with node data
    useEffect(() => {
      if (stryMutAct_9fa48("18")) {
        {}
      } else {
        stryCov_9fa48("18");
        const agentConfig = stryMutAct_9fa48("21") ? node.data.agent_config && {} : stryMutAct_9fa48("20") ? false : stryMutAct_9fa48("19") ? true : (stryCov_9fa48("19", "20", "21"), node.data.agent_config || {});
        if (stryMutAct_9fa48("24") ? document.activeElement === systemPromptRef.current : stryMutAct_9fa48("23") ? false : stryMutAct_9fa48("22") ? true : (stryCov_9fa48("22", "23", "24"), document.activeElement !== systemPromptRef.current)) {
          if (stryMutAct_9fa48("25")) {
            {}
          } else {
            stryCov_9fa48("25");
            setSystemPromptValue(stryMutAct_9fa48("28") ? agentConfig.system_prompt && '' : stryMutAct_9fa48("27") ? false : stryMutAct_9fa48("26") ? true : (stryCov_9fa48("26", "27", "28"), agentConfig.system_prompt || (stryMutAct_9fa48("29") ? "Stryker was here!" : (stryCov_9fa48("29"), ''))));
          }
        }
        if (stryMutAct_9fa48("32") ? document.activeElement === maxTokensRef.current : stryMutAct_9fa48("31") ? false : stryMutAct_9fa48("30") ? true : (stryCov_9fa48("30", "31", "32"), document.activeElement !== maxTokensRef.current)) {
          if (stryMutAct_9fa48("33")) {
            {}
          } else {
            stryCov_9fa48("33");
            setMaxTokensValue(stryMutAct_9fa48("36") ? agentConfig.max_tokens && '' : stryMutAct_9fa48("35") ? false : stryMutAct_9fa48("34") ? true : (stryCov_9fa48("34", "35", "36"), agentConfig.max_tokens || (stryMutAct_9fa48("37") ? "Stryker was here!" : (stryCov_9fa48("37"), ''))));
          }
        }
      }
    }, stryMutAct_9fa48("38") ? [] : (stryCov_9fa48("38"), [node.data.agent_config]));
    const agentConfig = stryMutAct_9fa48("41") ? node.data.agent_config && {} : stryMutAct_9fa48("40") ? false : stryMutAct_9fa48("39") ? true : (stryCov_9fa48("39", "40", "41"), node.data.agent_config || {});
    const currentModel = stryMutAct_9fa48("44") ? agentConfig.model && (availableModels.length > 0 ? availableModels[0].value : 'gpt-4o-mini') : stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43", "44"), agentConfig.model || ((stryMutAct_9fa48("48") ? availableModels.length <= 0 : stryMutAct_9fa48("47") ? availableModels.length >= 0 : stryMutAct_9fa48("46") ? false : stryMutAct_9fa48("45") ? true : (stryCov_9fa48("45", "46", "47", "48"), availableModels.length > 0)) ? availableModels[0].value : stryMutAct_9fa48("49") ? "" : (stryCov_9fa48("49"), 'gpt-4o-mini')));
    return <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">LLM Agent Configuration</h4>
      
      {/* Model Selection */}
      <div>
        <label htmlFor="agent-model" className="block text-sm font-medium text-gray-700 mb-1">
          Model
        </label>
        <select id="agent-model" value={currentModel} onChange={stryMutAct_9fa48("50") ? () => undefined : (stryCov_9fa48("50"), e => onUpdate(stryMutAct_9fa48("51") ? "" : (stryCov_9fa48("51"), 'agent_config'), stryMutAct_9fa48("52") ? {} : (stryCov_9fa48("52"), {
          ...agentConfig,
          model: e.target.value
        })))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select LLM model for agent">
          {(stryMutAct_9fa48("56") ? availableModels.length <= 0 : stryMutAct_9fa48("55") ? availableModels.length >= 0 : stryMutAct_9fa48("54") ? false : stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53", "54", "55", "56"), availableModels.length > 0)) ? availableModels.map(stryMutAct_9fa48("57") ? () => undefined : (stryCov_9fa48("57"), model => <option key={model.value} value={model.value}>
                {model.label}
              </option>)) : <>
              <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="gpt-4">GPT-4 (OpenAI)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
            </>}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {(stryMutAct_9fa48("61") ? availableModels.length <= 0 : stryMutAct_9fa48("60") ? availableModels.length >= 0 : stryMutAct_9fa48("59") ? false : stryMutAct_9fa48("58") ? true : (stryCov_9fa48("58", "59", "60", "61"), availableModels.length > 0)) ? stryMutAct_9fa48("62") ? `` : (stryCov_9fa48("62"), `This agent will use the configured LLM provider with the selected model`) : stryMutAct_9fa48("63") ? "" : (stryCov_9fa48("63"), 'This agent will call the OpenAI API with this model. Configure providers in Settings.')}
        </p>
      </div>

      {/* System Prompt */}
      <div className="mt-4">
        <label htmlFor="agent-system-prompt" className="block text-sm font-medium text-gray-700 mb-1">
          System Prompt
        </label>
        <textarea id="agent-system-prompt" ref={systemPromptRef} value={systemPromptValue} onChange={e => {
          if (stryMutAct_9fa48("64")) {
            {}
          } else {
            stryCov_9fa48("64");
            const newValue = e.target.value;
            setSystemPromptValue(newValue);
            onConfigUpdate(stryMutAct_9fa48("65") ? "" : (stryCov_9fa48("65"), 'agent_config'), stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), 'system_prompt'), newValue);
          }
        }} rows={4} placeholder="You are a helpful assistant that..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="System prompt for agent behavior" aria-describedby="system-prompt-help" />
        <p id="system-prompt-help" className="text-xs text-gray-500 mt-1">
          Instructions that define the agent's role and behavior
        </p>
      </div>

      {/* Temperature */}
      <div className="mt-4">
        <label htmlFor="agent-temperature" className="block text-sm font-medium text-gray-700 mb-1">
          Temperature: {stryMutAct_9fa48("69") ? agentConfig.temperature?.toFixed(1) && '0.7' : stryMutAct_9fa48("68") ? false : stryMutAct_9fa48("67") ? true : (stryCov_9fa48("67", "68", "69"), (stryMutAct_9fa48("70") ? agentConfig.temperature.toFixed(1) : (stryCov_9fa48("70"), agentConfig.temperature?.toFixed(1))) || (stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), '0.7')))}
        </label>
        <input id="agent-temperature" type="range" min="0" max="1" step="0.1" value={stryMutAct_9fa48("74") ? agentConfig.temperature && 0.7 : stryMutAct_9fa48("73") ? false : stryMutAct_9fa48("72") ? true : (stryCov_9fa48("72", "73", "74"), agentConfig.temperature || 0.7)} onChange={stryMutAct_9fa48("75") ? () => undefined : (stryCov_9fa48("75"), e => onUpdate(stryMutAct_9fa48("76") ? "" : (stryCov_9fa48("76"), 'agent_config'), stryMutAct_9fa48("77") ? {} : (stryCov_9fa48("77"), {
          ...agentConfig,
          temperature: parseFloat(e.target.value)
        })))} className="w-full" aria-label="Temperature control for agent creativity" aria-valuemin={0} aria-valuemax={1} aria-valuenow={stryMutAct_9fa48("80") ? agentConfig.temperature && 0.7 : stryMutAct_9fa48("79") ? false : stryMutAct_9fa48("78") ? true : (stryCov_9fa48("78", "79", "80"), agentConfig.temperature || 0.7)} />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Focused (0.0)</span>
          <span>Creative (1.0)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="mt-4">
        <label htmlFor="agent-max-tokens" className="block text-sm font-medium text-gray-700 mb-1">
          Max Tokens (optional)
        </label>
        <input id="agent-max-tokens" ref={maxTokensRef} type="number" value={maxTokensValue} onChange={e => {
          if (stryMutAct_9fa48("81")) {
            {}
          } else {
            stryCov_9fa48("81");
            const newValue = e.target.value ? parseInt(e.target.value) : undefined;
            setMaxTokensValue(e.target.value);
            onConfigUpdate(stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), 'agent_config'), stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), 'max_tokens'), newValue);
          }
        }} placeholder="Leave blank for default" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Maximum tokens for agent response" aria-describedby="max-tokens-help" />
        <p id="max-tokens-help" className="text-xs text-gray-500 mt-1">
          Maximum length of the agent's response
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4" role="status">
        <p className="text-xs text-blue-900 font-medium mb-1">🤖 This is a Real LLM Agent</p>
        <p className="text-xs text-blue-700">
          When executed, this agent will call OpenAI's API with your configured model and prompt.
          The agent receives data from its inputs and produces output for the next nodes.
        </p>
      </div>
    </div>;
  }
}