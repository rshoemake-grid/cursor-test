import AgentNode from './AgentNode'
import ConditionNode from './ConditionNode'
import LoopNode from './LoopNode'
import StartNode from './StartNode'
import EndNode from './EndNode'

export const nodeTypes = {
  agent: AgentNode,
  condition: ConditionNode,
  loop: LoopNode,
  start: StartNode,
  end: EndNode,
}

export { AgentNode, ConditionNode, LoopNode, StartNode, EndNode }

