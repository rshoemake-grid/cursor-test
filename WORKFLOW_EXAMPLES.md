# Workflow Examples & Patterns

This document provides example workflow patterns and use cases for the Agentic Workflow Engine.

## Table of Contents
1. [Basic Patterns](#basic-patterns)
2. [Content Creation](#content-creation)
3. [Research & Analysis](#research--analysis)
4. [Data Processing](#data-processing)
5. [Custom Workflows](#custom-workflows)

---

## Basic Patterns

### 1. Single Agent
The simplest workflow - one agent processes input.

```
[Start] → [Agent] → [End]
```

**Use Cases:**
- Text summarization
- Translation
- Question answering
- Classification

**Example:**
```python
workflow = {
    "name": "Text Summarizer",
    "nodes": [
        {
            "id": "summarizer",
            "type": "agent",
            "name": "Summarizer",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Summarize the following text concisely.",
                "temperature": 0.3
            },
            "inputs": [{"name": "text", "source_field": "text"}]
        }
    ],
    "edges": []
}

# Execute with:
# {"text": "Long article text here..."}
```

### 2. Sequential Pipeline
Multiple agents process data in sequence.

```
[Start] → [Agent 1] → [Agent 2] → [Agent 3] → [End]
```

**Use Cases:**
- Multi-stage refinement
- Create → Review → Approve workflows
- Data transformation pipelines

---

## Content Creation

### Blog Post Generator

```
[Start] → [Researcher] → [Outliner] → [Writer] → [Editor] → [SEO] → [End]
```

**Agents:**
1. **Researcher**: Gathers information on the topic
2. **Outliner**: Creates a structured outline
3. **Writer**: Writes the full article
4. **Editor**: Improves grammar and style
5. **SEO Optimizer**: Adds SEO keywords and meta description

```python
workflow = {
    "name": "Blog Post Generator",
    "nodes": [
        {
            "id": "researcher",
            "type": "agent",
            "name": "Researcher",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Research the topic and provide key facts, statistics, and relevant information.",
                "temperature": 0.5
            },
            "inputs": [{"name": "topic", "source_field": "topic"}]
        },
        {
            "id": "outliner",
            "type": "agent",
            "name": "Outliner",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Create a detailed outline with sections and key points.",
                "temperature": 0.4
            },
            "inputs": [
                {"name": "research", "source_node": "researcher", "source_field": "output"}
            ]
        },
        {
            "id": "writer",
            "type": "agent",
            "name": "Writer",
            "agent_config": {
                "model": "gpt-4o",
                "system_prompt": "Write a comprehensive blog post following the outline.",
                "temperature": 0.7,
                "max_tokens": 2000
            },
            "inputs": [
                {"name": "outline", "source_node": "outliner", "source_field": "output"}
            ]
        },
        {
            "id": "editor",
            "type": "agent",
            "name": "Editor",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Edit for clarity, grammar, and flow.",
                "temperature": 0.3
            },
            "inputs": [
                {"name": "draft", "source_node": "writer", "source_field": "output"}
            ]
        },
        {
            "id": "seo",
            "type": "agent",
            "name": "SEO Optimizer",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Add SEO keywords naturally and create a meta description.",
                "temperature": 0.4
            },
            "inputs": [
                {"name": "article", "source_node": "editor", "source_field": "output"}
            ]
        }
    ],
    "edges": [
        {"id": "e1", "source": "researcher", "target": "outliner"},
        {"id": "e2", "source": "outliner", "target": "writer"},
        {"id": "e3", "source": "writer", "target": "editor"},
        {"id": "e4", "source": "editor", "target": "seo"}
    ]
}
```

### Social Media Content Generator

```
[Start] → [Strategist] → [Writer] → [Optimizer] → [End]
```

**Agents:**
1. **Strategist**: Analyzes topic and suggests content strategy
2. **Writer**: Creates multiple post variations
3. **Optimizer**: Optimizes for platform-specific best practices

---

## Research & Analysis

### Competitive Analysis

```
[Start] → [Researcher] → [Analyzer] → [SWOT] → [Recommendations] → [End]
```

**Agents:**
1. **Researcher**: Gathers information about competitors
2. **Analyzer**: Identifies patterns and trends
3. **SWOT**: Creates SWOT analysis
4. **Recommendations**: Generates actionable recommendations

### Literature Review

```
[Start] → [Searcher] → [Summarizer] → [Synthesizer] → [Critic] → [End]
```

**Agents:**
1. **Searcher**: Identifies key papers and sources
2. **Summarizer**: Summarizes each source
3. **Synthesizer**: Finds common themes
4. **Critic**: Identifies gaps and controversies

### Market Research

```
[Start] → [Collector] → [Segmenter] → [Analyst] → [Reporter] → [End]
```

**Agents:**
1. **Data Collector**: Gathers market data
2. **Segmenter**: Identifies market segments
3. **Analyst**: Analyzes trends and opportunities
4. **Reporter**: Creates executive summary

---

## Data Processing

### Customer Feedback Pipeline

```
[Start] → [Classifier] → [Sentiment] → [Extractor] → [Prioritizer] → [End]
```

**Agents:**
1. **Classifier**: Categorizes feedback by type
2. **Sentiment Analyzer**: Determines sentiment (positive/negative/neutral)
3. **Insight Extractor**: Extracts key insights and pain points
4. **Prioritizer**: Ranks issues by importance

```python
workflow = {
    "name": "Feedback Analysis",
    "nodes": [
        {
            "id": "classifier",
            "type": "agent",
            "name": "Classifier",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Classify this feedback into: Feature Request, Bug Report, Praise, or Complaint. Respond with just the category.",
                "temperature": 0.1
            },
            "inputs": [{"name": "feedback", "source_field": "feedback"}]
        },
        {
            "id": "sentiment",
            "type": "agent",
            "name": "Sentiment Analyzer",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Analyze the sentiment: Positive, Neutral, or Negative. Include a brief explanation.",
                "temperature": 0.2
            },
            "inputs": [
                {"name": "feedback", "source_field": "feedback"}
            ]
        },
        {
            "id": "extractor",
            "type": "agent",
            "name": "Insight Extractor",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Extract the key insight or main point from this feedback.",
                "temperature": 0.3
            },
            "inputs": [
                {"name": "feedback", "source_field": "feedback"}
            ]
        }
    ],
    "edges": [
        {"id": "e1", "source": "classifier", "target": "sentiment"},
        {"id": "e2", "source": "sentiment", "target": "extractor"}
    ]
}
```

### Document Processing

```
[Start] → [Extractor] → [Validator] → [Enricher] → [Formatter] → [End]
```

**Agents:**
1. **Extractor**: Extracts structured data from documents
2. **Validator**: Validates extracted data
3. **Enricher**: Adds additional context/metadata
4. **Formatter**: Formats for target system

---

## Custom Workflows

### Code Review Assistant

```
[Start] → [Analyzer] → [Security Checker] → [Best Practices] → [Summarizer] → [End]
```

**Agents:**
1. **Code Analyzer**: Reviews code structure and logic
2. **Security Checker**: Identifies security vulnerabilities
3. **Best Practices**: Checks against best practices
4. **Summarizer**: Creates review summary with recommendations

### Email Response Generator

```
[Start] → [Classifier] → [Drafter] → [Tone Adjuster] → [Reviewer] → [End]
```

**Agents:**
1. **Classifier**: Categorizes email type and urgency
2. **Drafter**: Drafts initial response
3. **Tone Adjuster**: Adjusts tone based on context
4. **Reviewer**: Final review and polish

### Product Description Generator

```
[Start] → [Feature Extractor] → [Benefit Writer] → [SEO Optimizer] → [End]
```

**Agents:**
1. **Feature Extractor**: Identifies key features from product data
2. **Benefit Writer**: Translates features into customer benefits
3. **SEO Optimizer**: Optimizes for search engines

---

## Best Practices

### 1. Agent Specialization
- Each agent should have a clear, specific purpose
- Use focused system prompts
- Avoid making agents do too much

### 2. Temperature Settings
- **Low (0.1-0.3)**: Classification, extraction, structured outputs
- **Medium (0.4-0.6)**: Analysis, balanced creativity
- **High (0.7-1.0)**: Creative writing, brainstorming

### 3. Model Selection
- **gpt-4o-mini**: Fast, cost-effective for most tasks
- **gpt-4o**: Better for complex reasoning and long content
- **gpt-4**: Maximum quality when cost is less important

### 4. Error Handling
- Always validate inputs
- Include fallback strategies
- Log all steps for debugging

### 5. Performance
- Keep agent outputs focused and relevant
- Use max_tokens to control response length
- Consider execution time for multi-agent workflows

---

## Creating Your Own Workflow

### Step 1: Define the Goal
What's the end result you want?

### Step 2: Break Into Steps
What are the logical stages to reach that goal?

### Step 3: Assign Agents
Create an agent for each distinct step.

### Step 4: Configure Agents
- Write clear system prompts
- Set appropriate temperature
- Choose right model

### Step 5: Connect the Flow
Define edges to connect agents in the right order.

### Step 6: Test & Iterate
Run with test data and refine based on results.

---

## Example Template

```python
workflow = {
    "name": "Your Workflow Name",
    "description": "What this workflow does",
    "nodes": [
        {
            "id": "agent1",
            "type": "agent",
            "name": "Agent 1 Name",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Clear instructions for what this agent does",
                "temperature": 0.7,
                "max_tokens": 500
            },
            "inputs": [
                {"name": "input_name", "source_field": "workflow_input"}
            ],
            "position": {"x": 100, "y": 100}
        },
        {
            "id": "agent2",
            "type": "agent",
            "name": "Agent 2 Name",
            "agent_config": {
                "model": "gpt-4o-mini",
                "system_prompt": "Clear instructions for the second agent",
                "temperature": 0.5
            },
            "inputs": [
                {"name": "input_name", "source_node": "agent1", "source_field": "output"}
            ],
            "position": {"x": 300, "y": 100}
        }
    ],
    "edges": [
        {"id": "e1", "source": "agent1", "target": "agent2"}
    ],
    "variables": {}
}
```

Happy workflow building! 🚀

