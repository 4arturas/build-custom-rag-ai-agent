# RAG AI Agent with Tools Tutorial

This project demonstrates how to implement and use tools in a Retrieval-Augmented Generation (RAG) AI agent following the Deno tutorial "Build Custom RAG AI Agent".

## Files in this Tutorial

All tool examples are located in the `tools/` directory:

### 1. `tools/simple_tool_demo.js`
A simplified demonstration showing the basic concept of tools in a RAG agent:
- Creates a document retrieval tool
- Shows how an agent can decide to use a tool
- Demonstrates tool execution and response generation

### 2. `tools/rag_agent_with_tools.js`
A complete implementation following the exact pattern from the Deno tutorial:
- Document processing pipeline with Cheerio loader
- Graph state management using LangGraph
- All workflow components (nodes) as described in the tutorial
- Tool creation and execution using LangGraph's ToolNode
- Complete workflow compilation with conditional logic

### 3. `tools/tool_example.js`
An extended example showing both built-in and custom tools:
- Demonstrates creating multiple types of tools
- Shows integration of a custom calculator tool alongside document retrieval
- Implements tool decision-making logic

## How Tools Work in the RAG Agent

### Tool Creation
The agent creates a retriever tool that can search through processed documents:

```javascript
const tool = createRetrieverTool(
  retriever,
  {
    name: "search_documents",
    description: "Search and return information from documents.",
  },
);
```

### Tool Execution
The workflow includes a `ToolNode` that executes tools when called by the agent:

```javascript
const toolNode = new ToolNode([tool]);
```

### Tool Integration
The agent workflow integrates tools as follows:
1. Agent receives a query and may decide to use tools
2. If a tool is needed, the agent calls it (like searching documents)
3. Tool execution happens in the ToolNode
4. Results from the tool are used to generate a final response

## Key Components in the Tutorial

### Document Processing Pipeline
- Fetch documents using Cheerio web loader
- Split documents using Recursive Character Text Splitter (chunks of 500 with 50 overlap)
- Convert documents to embeddings using the embedding model
- Store in vector store and create retriever

### Workflow Components
Multiple nodes (functions) for discrete workflow parts:
- `shouldRetrieve()` - determines if documents need to be retrieved
- `gradeDocuments()` - grades document relevance
- `checkRelevance()` - orchestrates document grading
- `agent()` - core agent that determines next action
- `rewrite()` - rewrites queries to find relevant documents
- `generate()` - generates output based on query and found documents

### Models Used
- `llama3.2:3b` - for agent decision-making and tooling
- `deepseek-r1:8b` - for final output generation
- `mxbai-embed-large` - for creating document embeddings

## Running the Examples

First, ensure you have the required models installed:

```bash
ollama pull llama3.2:3b
ollama pull deepseek-r1:8b
ollama pull mxbai-embed-large
```

And make sure Ollama is running:

```bash
ollama serve
```

Then run any of the examples:

```bash
node tools/simple_tool_demo.js
node tools/rag_agent_with_tools.js
node tools/tool_example.js
```

## Key Concepts

### Tool Integration in LangGraph
- Tools are created as functions with schema definitions
- ToolNode executes the tools when called
- The agent can bind tools to the LLM using `.bindTools()`
- Tool results are passed back as messages in the state

### Conditional Logic
- The workflow uses conditional edges to decide what to do next
- Based on tool responses, the workflow may continue, retrieve more information, or rewrite queries
- This creates a sophisticated decision-making system

This tutorial demonstrates how tools enable RAG agents to interact with external data sources and perform complex reasoning tasks by breaking them down into steps.