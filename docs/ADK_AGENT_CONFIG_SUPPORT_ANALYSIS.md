# ADK Agent Config Support: Analysis & Recommendation

## Executive Summary

**Recommendation**: **Yes, add ADK agent config support** as an **optional enhancement**, but **not as a replacement** for the current system. This would provide users with additional flexibility and enable integration with Google's ADK ecosystem.

**Priority**: Medium (Nice-to-have enhancement, not critical path)

**Effort**: Medium (2-3 weeks for full implementation)

---

## Current System Overview

### Current AgentConfig Schema

```python
class AgentConfig(BaseModel):
    model: str = "gpt-4o-mini"
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    tools: List[str] = Field(default_factory=list)
```

### Current Architecture
- **Workflow-based**: Node-edge graph model
- **Sequential/Parallel execution**: Topological sort for dependencies
- **Multi-provider**: OpenAI, Anthropic, Google Gemini
- **Tool system**: Built-in tools (calculator, Python executor, web search, etc.)
- **Memory**: Short-term and long-term memory support
- **Visual builder**: React Flow-based UI

---

## ADK Agent Config Overview

### ADK Agent Config Schema (YAML)

```yaml
name: assistant_agent
model: gemini-2.5-flash
description: A helper agent description
instruction: You are a helpful assistant...
tools:
  - name: google_search
  - name: custom_tool_function
sub_agents:
  - config_path: sub_agent.yaml
```

### ADK Architecture
- **Agent-centric**: Hierarchical multi-agent composition
- **YAML-based**: Code-free agent definition
- **Gemini-focused**: Currently only supports Gemini models (experimental)
- **Built-in tools**: Google Search, web page loading, etc.
- **Sub-agents**: Agents can delegate to other agents
- **Event-driven**: Runtime with execution inspection

---

## Comparison: Current System vs ADK

| Feature | Current System | ADK Agent Config |
|---------|---------------|------------------|
| **Model Support** | ✅ OpenAI, Anthropic, Gemini | ⚠️ Gemini only (experimental) |
| **Configuration Format** | JSON (in workflow) | YAML (standalone) |
| **Agent Composition** | Workflow nodes/edges | Hierarchical sub-agents |
| **Tool System** | Custom tools + built-ins | ADK built-ins + custom functions |
| **Execution Model** | Sequential/parallel workflows | Event-driven runtime |
| **Visual Builder** | ✅ React Flow UI | ❌ Code/YAML only |
| **Memory** | ✅ Short-term + long-term | ⚠️ Limited |
| **Production Ready** | ✅ Yes | ⚠️ Experimental |

---

## Benefits of Adding ADK Support

### 1. **Ecosystem Integration** ✅
- **Google Cloud Integration**: Direct integration with Vertex AI Agent Engine
- **Enterprise Tools**: Access to 100+ Google Cloud Application Integration connectors
- **Deployment Options**: Cloud Run, Vertex AI Agent Engine deployment
- **Google Ecosystem**: Better integration with Google services

### 2. **Advanced Agent Features** ✅
- **Sub-Agent Delegation**: Agents can delegate to specialized sub-agents
- **Built-in Tools**: Google Search, web page loading, enterprise web search
- **Agent Config YAML**: Code-free agent definition (useful for non-developers)
- **Event-Driven Runtime**: More flexible execution model

### 3. **User Choice** ✅
- **Flexibility**: Users can choose between workflow-based (current) or ADK-based agents
- **Migration Path**: Users can migrate from ADK to your platform
- **Best of Both Worlds**: Combine workflow orchestration with ADK agent capabilities

### 4. **Competitive Advantage** ✅
- **Differentiation**: Support for both paradigms sets you apart
- **Enterprise Appeal**: Google Cloud integration appeals to enterprise customers
- **Future-Proofing**: Aligns with Google's agent development direction

---

## Challenges & Considerations

### 1. **Model Limitations** ⚠️
- **Gemini Only**: ADK Agent Config currently only supports Gemini models
- **Experimental**: Feature is still experimental with known limitations
- **Your System**: Already supports OpenAI, Anthropic, Gemini - more flexible

**Impact**: Users would need to use Gemini models when using ADK configs.

### 2. **Architectural Differences** ⚠️
- **Workflow vs Agent-Centric**: Different execution models
- **Integration Complexity**: Need to bridge two paradigms
- **UI Complexity**: May need separate UI for ADK agents vs workflow agents

**Impact**: Requires careful design to integrate both approaches.

### 3. **Maintenance Overhead** ⚠️
- **Two Systems**: Need to maintain both workflow and ADK agent systems
- **Documentation**: Need to document both approaches
- **Testing**: Need to test both systems

**Impact**: Increased complexity and maintenance burden.

### 4. **Feature Parity** ⚠️
- **ADK Limitations**: Some ADK tools not fully supported
- **Missing Features**: LangGraphAgent, A2aAgent not supported
- **Your Features**: May not map directly to ADK concepts

**Impact**: May not be able to support all ADK features.

---

## Implementation Approach

### Option 1: **Dual Mode Support** (Recommended)

Allow users to choose between:
- **Workflow Mode**: Current node-edge system (default)
- **ADK Mode**: ADK agent config support (optional)

**Implementation**:
1. Add `agent_type` field to `AgentConfig`:
   ```python
   class AgentConfig(BaseModel):
       agent_type: Literal["workflow", "adk"] = "workflow"
       # ... existing fields ...
       adk_config: Optional[ADKAgentConfig] = None
   ```

2. Create `ADKAgentConfig` schema:
   ```python
   class ADKAgentConfig(BaseModel):
       name: str
       description: Optional[str] = None
       instruction: Optional[str] = None  # Maps to system_prompt
       sub_agents: List[str] = Field(default_factory=list)
       adk_tools: List[str] = Field(default_factory=list)
       yaml_config: Optional[str] = None  # Raw YAML if provided
   ```

3. Create `ADKAgent` class:
   ```python
   class ADKAgent(BaseAgent):
       """Agent that uses Google ADK for execution"""
       def __init__(self, node: Node, adk_config: ADKAgentConfig):
           # Initialize ADK agent from config
           # Use google-adk library
   ```

4. Update agent registry:
   ```python
   AGENT_REGISTRY = {
       NodeType.AGENT: UnifiedLLMAgent,  # Default
       NodeType.ADK_AGENT: ADKAgent,  # New
   }
   ```

**Pros**:
- ✅ Backward compatible
- ✅ Users can choose their preferred approach
- ✅ Gradual migration path

**Cons**:
- ⚠️ More complex codebase
- ⚠️ Need to maintain both systems

### Option 2: **ADK Import/Export**

Support importing/exporting ADK agent configs without full runtime support.

**Implementation**:
1. Add import function: Convert ADK YAML → Workflow nodes
2. Add export function: Convert Workflow nodes → ADK YAML
3. No runtime ADK support, just format conversion

**Pros**:
- ✅ Simpler implementation
- ✅ Enables migration between systems
- ✅ No runtime dependencies

**Cons**:
- ❌ No runtime ADK features
- ❌ Limited value

### Option 3: **Hybrid Approach** (Best Long-Term)

Support ADK features within the workflow system:
- Add sub-agent support to workflow nodes
- Add ADK tools as built-in tools
- Support ADK YAML import/export
- Use ADK runtime for specific agent types

**Implementation**:
1. Extend `AgentConfig` with ADK-compatible fields
2. Add sub-agent support to workflow nodes
3. Integrate ADK tools into tool registry
4. Support ADK YAML import/export

**Pros**:
- ✅ Best of both worlds
- ✅ Unified system
- ✅ Maximum flexibility

**Cons**:
- ⚠️ Most complex to implement
- ⚠️ Requires careful design

---

## Recommended Implementation Plan

### Phase 1: **Foundation** (Week 1)
1. ✅ Add `ADKAgentConfig` schema to `schemas.py`
2. ✅ Install `google-adk` Python package
3. ✅ Create basic `ADKAgent` class skeleton
4. ✅ Add `agent_type` field to `AgentConfig`

### Phase 2: **Core Integration** (Week 2)
1. ✅ Implement ADK agent initialization from config
2. ✅ Integrate ADK tools into tool registry
3. ✅ Add ADK agent to agent registry
4. ✅ Basic execution support

### Phase 3: **Advanced Features** (Week 3)
1. ✅ Sub-agent support
2. ✅ ADK YAML import/export
3. ✅ UI updates for ADK agent configuration
4. ✅ Documentation and examples

### Phase 4: **Polish** (Ongoing)
1. ✅ Testing and bug fixes
2. ✅ Performance optimization
3. ✅ User documentation
4. ✅ Example workflows

---

## Code Examples

### Current AgentConfig
```python
agent_config = AgentConfig(
    model="gpt-4o-mini",
    system_prompt="You are a helpful assistant",
    temperature=0.7,
    tools=["calculator", "web_search"]
)
```

### ADK AgentConfig (Proposed)
```python
agent_config = AgentConfig(
    agent_type="adk",
    model="gemini-2.5-flash",
    system_prompt="You are a helpful assistant",
    temperature=0.7,
    adk_config=ADKAgentConfig(
        name="assistant_agent",
        description="A helper agent",
        instruction="You are a helpful assistant...",
        adk_tools=["google_search"],
        sub_agents=["research_agent", "writer_agent"]
    )
)
```

### ADK Agent Class (Proposed)
```python
from google.adk.agents.llm_agent import Agent as ADKAgent

class ADKAgentWrapper(BaseAgent):
    """Wrapper around Google ADK Agent"""
    
    def __init__(self, node: Node, adk_config: ADKAgentConfig):
        super().__init__(node)
        self.adk_config = adk_config
        
        # Initialize ADK agent
        self.adk_agent = ADKAgent(
            model=node.agent_config.model,
            name=adk_config.name,
            description=adk_config.description,
            instruction=adk_config.instruction or node.agent_config.system_prompt,
            tools=self._load_adk_tools(adk_config.adk_tools)
        )
    
    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute using ADK runtime"""
        # Convert inputs to ADK format
        # Execute via ADK
        # Convert outputs back
        result = await self.adk_agent.run(inputs)
        return {"output": result}
```

---

## UI Considerations

### Agent Node Editor Updates

Add toggle/selector for agent type:
```typescript
<Select
  label="Agent Type"
  value={agentConfig.agent_type || "workflow"}
  onChange={(e) => updateAgentType(e.target.value)}
>
  <option value="workflow">Workflow Agent</option>
  <option value="adk">ADK Agent</option>
</Select>

{agentConfig.agent_type === "adk" && (
  <ADKAgentConfigEditor
    config={agentConfig.adk_config}
    onUpdate={updateADKConfig}
  />
)}
```

### ADK-Specific Fields
- Agent name
- Description
- Instruction (system prompt)
- ADK tools selector
- Sub-agents selector

---

## Migration Strategy

### For Existing Users
- ✅ Current workflows continue to work unchanged
- ✅ ADK support is opt-in
- ✅ Can gradually migrate workflows to ADK if desired

### For New Users
- ✅ Can choose workflow or ADK approach
- ✅ Can mix both in same workflow (different nodes)
- ✅ Can import ADK configs from other systems

---

## Success Metrics

### Technical Metrics
- ✅ ADK agents execute successfully
- ✅ ADK tools work correctly
- ✅ Sub-agents delegate properly
- ✅ Performance comparable to workflow agents

### User Metrics
- ✅ Users can create ADK agents via UI
- ✅ ADK YAML import/export works
- ✅ Documentation is clear
- ✅ Examples are helpful

---

## Risks & Mitigations

### Risk 1: ADK Experimental Status
**Risk**: ADK Agent Config is experimental, may change
**Mitigation**: 
- Abstract ADK implementation behind interface
- Version ADK configs
- Provide migration path if ADK changes

### Risk 2: Model Limitations
**Risk**: ADK only supports Gemini
**Mitigation**:
- Make ADK support optional
- Keep workflow agents as default
- Clearly document limitations

### Risk 3: Complexity
**Risk**: Two systems increase complexity
**Mitigation**:
- Clean abstraction between systems
- Comprehensive testing
- Good documentation

---

## Conclusion

### Should We Add ADK Support?

**Yes, with conditions:**

1. ✅ **As an optional enhancement**, not replacement
2. ✅ **Dual-mode support** (workflow + ADK)
3. ✅ **Clear documentation** of limitations
4. ✅ **Gradual rollout** with user feedback

### Key Benefits
- ✅ Google Cloud ecosystem integration
- ✅ Advanced agent features (sub-agents, ADK tools)
- ✅ Competitive differentiation
- ✅ Future-proofing

### Key Considerations
- ⚠️ ADK is experimental (Gemini-only)
- ⚠️ Increased complexity
- ⚠️ Maintenance overhead

### Final Recommendation

**Proceed with Phase 1 (Foundation)** to evaluate feasibility, then decide on full implementation based on:
- User demand
- ADK maturity
- Integration complexity
- Resource availability

---

## Next Steps

1. **Research**: Deep dive into ADK Python SDK
2. **Prototype**: Build minimal ADK agent integration
3. **Evaluate**: Test with sample workflows
4. **Decide**: Proceed with full implementation or defer

---

*Last Updated: February 2026*
