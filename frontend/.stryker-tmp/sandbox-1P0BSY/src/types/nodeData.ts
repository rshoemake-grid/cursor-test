/**
 * Type definitions for node data structures
 * Replaces 'any' types throughout the codebase
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
import { Node } from '@xyflow/react';
export interface AgentConfig {
  model?: string;
  system_prompt?: string;
  max_tokens?: number;
  temperature?: number;
}
export interface ConditionConfig {
  condition_type?: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'not_greater_than' | 'less_than' | 'not_less_than' | 'empty' | 'not_empty' | 'custom';
  field?: string;
  value?: string;
}
export interface LoopConfig {
  loop_type?: 'for_each' | 'while' | 'until';
  max_iterations?: number;
  items_source?: string;
  condition?: string;
}
export interface InputMapping {
  name: string;
  source_node?: string;
  source_field?: string;
}
export interface InputConfig {
  mode?: 'read' | 'write';
  bucket_name?: string;
  object_path?: string;
  object_key?: string;
  credentials?: string;
  access_key_id?: string;
  secret_access_key?: string;
  region?: string;
  project_id?: string;
  topic_name?: string;
  subscription_name?: string;
  file_path?: string;
  file_pattern?: string;
  overwrite?: boolean;
  inputs?: Array<{
    name: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    description?: string;
    default_value?: string | number;
  }>;
}
export interface NodeData {
  name?: string;
  label?: string;
  description?: string;
  agent_config?: AgentConfig;
  condition_config?: ConditionConfig;
  loop_config?: LoopConfig;
  input_config?: InputConfig;
  inputs?: InputMapping[];
  executionStatus?: 'running' | 'completed' | 'failed' | 'pending';
}
export type NodeWithData = Node<NodeData>;

// Type guards
export function isAgentNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'agent';
} {
  if (stryMutAct_9fa48("645")) {
    {}
  } else {
    stryCov_9fa48("645");
    return stryMutAct_9fa48("648") ? node?.type !== 'agent' : stryMutAct_9fa48("647") ? false : stryMutAct_9fa48("646") ? true : (stryCov_9fa48("646", "647", "648"), (stryMutAct_9fa48("649") ? node.type : (stryCov_9fa48("649"), node?.type)) === (stryMutAct_9fa48("650") ? "" : (stryCov_9fa48("650"), 'agent')));
  }
}
export function isConditionNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'condition';
} {
  if (stryMutAct_9fa48("651")) {
    {}
  } else {
    stryCov_9fa48("651");
    return stryMutAct_9fa48("654") ? node?.type !== 'condition' : stryMutAct_9fa48("653") ? false : stryMutAct_9fa48("652") ? true : (stryCov_9fa48("652", "653", "654"), (stryMutAct_9fa48("655") ? node.type : (stryCov_9fa48("655"), node?.type)) === (stryMutAct_9fa48("656") ? "" : (stryCov_9fa48("656"), 'condition')));
  }
}
export function isLoopNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'loop';
} {
  if (stryMutAct_9fa48("657")) {
    {}
  } else {
    stryCov_9fa48("657");
    return stryMutAct_9fa48("660") ? node?.type !== 'loop' : stryMutAct_9fa48("659") ? false : stryMutAct_9fa48("658") ? true : (stryCov_9fa48("658", "659", "660"), (stryMutAct_9fa48("661") ? node.type : (stryCov_9fa48("661"), node?.type)) === (stryMutAct_9fa48("662") ? "" : (stryCov_9fa48("662"), 'loop')));
  }
}
export function isInputNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'gcp_bucket' | 'aws_s3' | 'gcp_pubsub' | 'local_filesystem' | 'database' | 'firebase' | 'bigquery';
} {
  if (stryMutAct_9fa48("663")) {
    {}
  } else {
    stryCov_9fa48("663");
    return stryMutAct_9fa48("666") ? node !== null || ['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem', 'database', 'firebase', 'bigquery'].includes(node.type || '') : stryMutAct_9fa48("665") ? false : stryMutAct_9fa48("664") ? true : (stryCov_9fa48("664", "665", "666"), (stryMutAct_9fa48("668") ? node === null : stryMutAct_9fa48("667") ? true : (stryCov_9fa48("667", "668"), node !== null)) && (stryMutAct_9fa48("669") ? [] : (stryCov_9fa48("669"), [stryMutAct_9fa48("670") ? "" : (stryCov_9fa48("670"), 'gcp_bucket'), stryMutAct_9fa48("671") ? "" : (stryCov_9fa48("671"), 'aws_s3'), stryMutAct_9fa48("672") ? "" : (stryCov_9fa48("672"), 'gcp_pubsub'), stryMutAct_9fa48("673") ? "" : (stryCov_9fa48("673"), 'local_filesystem'), stryMutAct_9fa48("674") ? "" : (stryCov_9fa48("674"), 'database'), stryMutAct_9fa48("675") ? "" : (stryCov_9fa48("675"), 'firebase'), stryMutAct_9fa48("676") ? "" : (stryCov_9fa48("676"), 'bigquery')])).includes(stryMutAct_9fa48("679") ? node.type && '' : stryMutAct_9fa48("678") ? false : stryMutAct_9fa48("677") ? true : (stryCov_9fa48("677", "678", "679"), node.type || (stryMutAct_9fa48("680") ? "Stryker was here!" : (stryCov_9fa48("680"), '')))));
  }
}
export function isStartNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'start';
} {
  if (stryMutAct_9fa48("681")) {
    {}
  } else {
    stryCov_9fa48("681");
    return stryMutAct_9fa48("684") ? node?.type !== 'start' : stryMutAct_9fa48("683") ? false : stryMutAct_9fa48("682") ? true : (stryCov_9fa48("682", "683", "684"), (stryMutAct_9fa48("685") ? node.type : (stryCov_9fa48("685"), node?.type)) === (stryMutAct_9fa48("686") ? "" : (stryCov_9fa48("686"), 'start')));
  }
}
export function isEndNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'end';
} {
  if (stryMutAct_9fa48("687")) {
    {}
  } else {
    stryCov_9fa48("687");
    return stryMutAct_9fa48("690") ? node?.type !== 'end' : stryMutAct_9fa48("689") ? false : stryMutAct_9fa48("688") ? true : (stryCov_9fa48("688", "689", "690"), (stryMutAct_9fa48("691") ? node.type : (stryCov_9fa48("691"), node?.type)) === (stryMutAct_9fa48("692") ? "" : (stryCov_9fa48("692"), 'end')));
  }
}