```sh
npm install -g @google/gemini-cli
````

# Build Custom RAG AI Agent

This project follows the tutorials from Deno's blog on building custom RAG AI agent using Deno, Llama, and Ollama.

## Overview

This project demonstrates how to create a custom RAG (Retrieval-Augmented Generation) AI agent that can leverage your own data alongside large language models, enabling more accurate and contextually relevant AI responses for domain-specific applications. The implementation uses a local-first approach for privacy and security.

## The AI Stack (DINO, LLAMA, WHALE)

- **DINO 🦕 (Deno)**: JavaScript/TypeScript runtime with built-in Jupyter kernel for interactive development
- **LLAMA 🦙 (LangChain.js)**: Provides a consistent interface for interacting with large language models and creating modular AI workflows
- **WHALE 🐋 (Ollama)**: Framework for running language models locally

## Models Used

- **DeepSeek R1 (8 billion parameters)**: Used for final output generation (`deepseek-r1:8b`)
- **Mixedbread's embedding model**: `mxbai-embed-large` - transforms text into searchable format
- **Meta's Llama 3.2 (3 billion parameters)**: Supports tooling for calling additional functions (`llama3.2:3b`)

## Architecture Components

- Vector store (in-memory, with Chroma as alternative)
- Document retriever
- Graph state management system using LangGraph
- Tool nodes and functions
- Workflow engine with conditional logic

## References

https://deno.com/blog/the-dino-llama-and-whale
https://deno.com/blog/build-custom-rag-ai-agent

## Setup

### Prerequisites

- Node.js installed
- Ollama installed and running

### Initialize Project

```sh
npm init -y
```

### Install Required Libraries

```sh
npm install @langchain/community @langchain/llms langchain @langchain/core @langchain/langgraph
```

### Additional Dependencies for Full Implementation

For the complete RAG agent implementation, you may also need:
```sh
npm install cheerio @langchain/ollama zod
```

> **Note**: `cheerio` is used for web document scraping, `@langchain/ollama` provides Ollama integration, and `zod` is used for validation in the tutorial.

### Pull Ollama Models

```sh
ollama pull llama3.2
ollama pull mxbai-embed-large
```

### Run Ollama Server

```sh
ollama serve
```

### Run Application

```sh
node index.js
```

## File Structure

The project includes the following files and directories:

```
project-root/
├── package.json
├── index.js          # Main application file
├── documents.js      # Document processing module (placeholder)
├── tools.js          # Tool integration module (placeholder)
├── grader.js         # Document relevance grading module (placeholder)
├── tutorial.js       # Simple RAG example
├── test.js           # Test implementation
├── TOOLS_TUTORIAL.md # Tutorial on using tools in the RAG agent
├── tools/            # Directory containing tool examples
│   ├── simple_tool_demo.js
│   ├── rag_agent_with_tools.js
│   └── tool_example.js
└── documents/        # Optional: for storing local documents
```

## Implementation Details

### 1. Document Processing Pipeline
- Fetch documents using Cheerio web loader
- Split documents using Recursive Character Text Splitter (chunks of 500 with 50 overlap)
- Convert documents to embeddings using the embedding model
- Store in vector store and create retriever

### 2. Workflow Components
Multiple nodes (functions) for discrete workflow parts:
- `shouldRetrieve()` - determines if documents need to be retrieved
- `gradeDocuments()` - grades document relevance
- `checkRelevance()` - orchestrates document grading
- `agent()` - core agent that determines next action
- `rewrite()` - rewrites queries to find relevant documents
- `generate()` - generates output based on query and found documents

### Key Features
- **Local execution**: All models run locally via Ollama
- **Security**: Confidential documents processed locally
- **Modular design**: Component-based workflow with clear separation of concerns
- **Tool integration**: Models can call external functions/tools
- **Query refinement**: Ability to rewrite and improve queries
- **Relevance checking**: Documents are graded for relevance before response generation
- **Streaming responses**: For better user experience

## Quick Start

1. Make sure Ollama is running: `ollama serve`
2. Pull required models:
   ```bash
   ollama pull llama3.2:3b
   ollama pull mxbai-embed-large
   ollama pull deepseek-r1:8b
   ```
3. Install dependencies: `npm install`
4. Run the application: `npm start` or `node index.js`

## Notes

The RAG approach combines the power of large language models with your own data, allowing for more accurate and context-aware responses. The implementation follows a specific workflow pattern: decides to retrieve → retrieves documents → grades relevance → rewrites query if needed → generates final response, creating a sophisticated retrieval-augmented generation system.

## Usage Guide

### Step-by-Step Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Verify Ollama is Running**
   ```bash
   ollama serve
   ```

3. **Run the Application**
   ```bash
   npm start
   # or
   node index.js
   ```

### How It Works

The RAG AI agent follows this workflow:
1. **Input**: User provides a query/question (to be implemented in `index.js`)
2. **Agent Decision**: Determines if document retrieval is needed
3. **Retrieve**: Fetches relevant documents using the tool
4. **Grade**: Evaluates document relevance to the query
5. **Generate**: Creates a response using relevant documents
6. **Output**: Returns the final response to the user

### Adding User Input

To enable user input, you need to modify `index.js` to add a query prompt:

```javascript
import readline from 'readline/promises';

// Inside runRagAgent() function, replace the hardcoded query with:
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const query = await rl.question('Enter your question: ');
rl.close();
```

### Customizing

- **Change Models**: Edit the model names in `index.js`:
  - `llama3.2:3b` for the main agent
  - `deepseek-r1:8b` for generation
  - `mxbai-embed-large` for embeddings

- **Modify Document Sources**: Update URLs in `tools.js` to point to your desired sources.

- **Adjust Chunks**: Modify `chunkSize` and `chunkOverlap` in `documents.js` to change how documents are split.

### Troubleshooting

- **Model not found**: Ensure all required models are downloaded
- **Connection errors**: Verify Ollama server is running
- **Memory issues**: Reduce chunk size for large documents