# Build Custom RAG AI Agent - Project Context

## Project Overview
This project is focused on building a custom RAG (Retrieval-Augmented Generation) AI agent using the AI stack consisting of Deno, LangChain, and Ollama. The project follows tutorials from Deno's blog and implements the RAG approach, which combines the power of large language models with custom data to provide more accurate and context-aware responses.

The RAG approach enables the creation of AI agents that can leverage your own data sources to provide more accurate and contextually relevant responses, making it particularly useful for applications requiring domain-specific knowledge.

## Technologies Used
- **Deno**: JavaScript/TypeScript runtime for the application (DINO in the stack)
- **Llama**: LangChain.js - AI framework for creating AI workflows (LLAMA in the stack)  
- **Ollama**: Local LLM server for running models (WHALE in the stack)
- **LangChain**: Framework for developing applications with language models
- **Node.js**: Runtime environment (as indicated by the `node index.js` command)

## AI Stack (DINO, LLAMA, WHALE)
- **DINO (Deno)**: Modern runtime for JavaScript and TypeScript with built-in Jupyter kernel for interactive development
- **LLAMA (LangChain.js)**: Provides a consistent interface for interacting with large language models and creating modular AI workflows
- **WHALE (Ollama)**: Framework for running language models locally

## Models Used in the Implementation
- **DeepSeek R1 (8 billion parameters)**: Used for final output generation (`deepseek-r1:8b`)
- **Mixedbread's embedding model**: `mxbai-embed-large` - transforms text into searchable format
- **Meta's Llama 3.2 (3 billion parameters)**: Supports tooling for calling additional functions (`llama3.2:3b`)

## Project Architecture
The RAG AI agent architecture consists of:
- A main entry point file (index.js)
- Vector store (in-memory, with Chroma as alternative)
- Document retriever
- Graph state management system using LangGraph
- Tool nodes and functions
- Workflow engine with conditional logic

## Building and Running the Project
### Prerequisites
- Node.js installed
- Ollama installed and running
- Git (to clone if needed)

### Setup Commands
```sh
# Initialize the project
npm init -y

# Install required libraries
npm install @langchain/community @langchain/llms langchain @langchain/core

# Pull Ollama models
ollama pull llama3.2
ollama pull mxbai-embed-large

# Run Ollama server (in a separate terminal)
ollama serve

# Run the application
node index.js
```

## Key Dependencies
- `@langchain/community`: Community maintained LangChain integrations
- `@langchain/llms`: LangChain LLM interfaces
- `langchain`: Core LangChain library
- `@langchain/core`: Core LangChain functionality

## Implementation Details from Tutorial

### 1. Document Processing Pipeline
- Fetch documents using Cheerio web loader
- Split documents using Recursive Character Text Splitter (chunks of 500 with 50 overlap)
- Convert documents to embeddings using the embedding model
- Store in vector store and create retriever

### 2. State Management
- Create a graph state structure with messages
- Use LangGraph's Annotation system for state management

### 3. Tool Creation
- Create a retriever tool that searches blog posts
- Wrap the retriever in a ToolNode

### 4. Workflow Components
Multiple nodes (functions) for discrete workflow parts:
- `shouldRetrieve()` - determines if documents need to be retrieved
- `gradeDocuments()` - grades document relevance
- `checkRelevance()` - orchestrates document grading
- `agent()` - core agent that determines next action
- `rewrite()` - rewrites queries to find relevant documents
- `generate()` - generates output based on query and found documents

### 5. Key Features
- **Local execution**: All models run locally via Ollama
- **Security**: Confidential documents processed locally
- **Modular design**: Component-based workflow with clear separation of concerns
- **Tool integration**: Models can call external functions/tools
- **Query refinement**: Ability to rewrite and improve queries
- **Relevance checking**: Documents are graded for relevance before response generation
- **Streaming responses**: For better user experience

## Development Conventions
- Uses Node.js runtime environment
- Follows LangChain patterns for RAG implementations
- Integrates with Ollama for local model serving
- Implements modular workflow design with distinct nodes
- Uses conditional logic for workflow decision-making
- Follows Deno's recommended practices for AI agent development

## Project Status
Currently the project structure exists primarily in documentation (README.md) with setup instructions. The actual implementation files (index.js, etc.) may need to be created following the Deno blog tutorials referenced in the README.

## Purpose
The project demonstrates how to create a custom RAG AI agent that can leverage your own data alongside large language models, enabling more accurate and contextually relevant AI responses for domain-specific applications. It showcases a local-first approach to AI development where models run locally for privacy and security purposes.