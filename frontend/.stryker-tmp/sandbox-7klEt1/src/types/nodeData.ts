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
  if (stryMutAct_9fa48("786")) {
    {}
  } else {
    stryCov_9fa48("786");
    return stryMutAct_9fa48("789") ? node?.type !== 'agent' : stryMutAct_9fa48("788") ? false : stryMutAct_9fa48("787") ? true : (stryCov_9fa48("787", "788", "789"), (stryMutAct_9fa48("790") ? node.type : (stryCov_9fa48("790"), node?.type)) === (stryMutAct_9fa48("791") ? "" : (stryCov_9fa48("791"), 'agent')));
  }
}
export function isConditionNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'condition';
} {
  if (stryMutAct_9fa48("792")) {
    {}
  } else {
    stryCov_9fa48("792");
    return stryMutAct_9fa48("795") ? node?.type !== 'condition' : stryMutAct_9fa48("794") ? false : stryMutAct_9fa48("793") ? true : (stryCov_9fa48("793", "794", "795"), (stryMutAct_9fa48("796") ? node.type : (stryCov_9fa48("796"), node?.type)) === (stryMutAct_9fa48("797") ? "" : (stryCov_9fa48("797"), 'condition')));
  }
}
export function isLoopNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'loop';
} {
  if (stryMutAct_9fa48("798")) {
    {}
  } else {
    stryCov_9fa48("798");
    return stryMutAct_9fa48("801") ? node?.type !== 'loop' : stryMutAct_9fa48("800") ? false : stryMutAct_9fa48("799") ? true : (stryCov_9fa48("799", "800", "801"), (stryMutAct_9fa48("802") ? node.type : (stryCov_9fa48("802"), node?.type)) === (stryMutAct_9fa48("803") ? "" : (stryCov_9fa48("803"), 'loop')));
  }
}
export function isInputNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'gcp_bucket' | 'aws_s3' | 'gcp_pubsub' | 'local_filesystem' | 'database' | 'firebase' | 'bigquery';
} {
  if (stryMutAct_9fa48("804")) {
    {}
  } else {
    stryCov_9fa48("804");
    return stryMutAct_9fa48("807") ? node !== null || ['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem', 'database', 'firebase', 'bigquery'].includes(node.type || '') : stryMutAct_9fa48("806") ? false : stryMutAct_9fa48("805") ? true : (stryCov_9fa48("805", "806", "807"), (stryMutAct_9fa48("809") ? node === null : stryMutAct_9fa48("808") ? true : (stryCov_9fa48("808", "809"), node !== null)) && (stryMutAct_9fa48("810") ? [] : (stryCov_9fa48("810"), [stryMutAct_9fa48("811") ? "" : (stryCov_9fa48("811"), 'gcp_bucket'), stryMutAct_9fa48("812") ? "" : (stryCov_9fa48("812"), 'aws_s3'), stryMutAct_9fa48("813") ? "" : (stryCov_9fa48("813"), 'gcp_pubsub'), stryMutAct_9fa48("814") ? "" : (stryCov_9fa48("814"), 'local_filesystem'), stryMutAct_9fa48("815") ? "" : (stryCov_9fa48("815"), 'database'), stryMutAct_9fa48("816") ? "" : (stryCov_9fa48("816"), 'firebase'), stryMutAct_9fa48("817") ? "" : (stryCov_9fa48("817"), 'bigquery')])).includes(stryMutAct_9fa48("820") ? node.type && '' : stryMutAct_9fa48("819") ? false : stryMutAct_9fa48("818") ? true : (stryCov_9fa48("818", "819", "820"), node.type || (stryMutAct_9fa48("821") ? "Stryker was here!" : (stryCov_9fa48("821"), '')))));
  }
}
export function isStartNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'start';
} {
  if (stryMutAct_9fa48("822")) {
    {}
  } else {
    stryCov_9fa48("822");
    return stryMutAct_9fa48("825") ? node?.type !== 'start' : stryMutAct_9fa48("824") ? false : stryMutAct_9fa48("823") ? true : (stryCov_9fa48("823", "824", "825"), (stryMutAct_9fa48("826") ? node.type : (stryCov_9fa48("826"), node?.type)) === (stryMutAct_9fa48("827") ? "" : (stryCov_9fa48("827"), 'start')));
  }
}
export function isEndNode(node: NodeWithData | null): node is NodeWithData & {
  type: 'end';
} {
  if (stryMutAct_9fa48("828")) {
    {}
  } else {
    stryCov_9fa48("828");
    return stryMutAct_9fa48("831") ? node?.type !== 'end' : stryMutAct_9fa48("830") ? false : stryMutAct_9fa48("829") ? true : (stryCov_9fa48("829", "830", "831"), (stryMutAct_9fa48("832") ? node.type : (stryCov_9fa48("832"), node?.type)) === (stryMutAct_9fa48("833") ? "" : (stryCov_9fa48("833"), 'end')));
  }
}