# RAG AI Agent - Usage Guide

## Prerequisites
1. Node.js installed
2. Ollama installed and running (`ollama serve`)
3. Required models downloaded:
   ```bash
   ollama pull llama3.2:3b
   ollama pull mxbai-embed-large
   ollama pull deepseek-r1:8b
   ```

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Verify Ollama is Running
```bash
ollama serve
```

### 3. Run the Application
```bash
npm start
# or
node index.js
```

## How It Works

The RAG AI agent follows this workflow:
1. **Input**: User provides a query/question
2. **Agent Decision**: Determines if document retrieval is needed
3. **Retrieve**: Fetches relevant documents using the tool
4. **Grade**: Evaluates document relevance to the query
5. **Generate**: Creates a response using relevant documents
6. **Output**: Returns the final response to the user

## Customizing

### Change Models
Edit the model names in `index.js`:
- `llama3.2:3b` for the main agent
- `deepseek-r1:8b` for generation
- `mxbai-embed-large` for embeddings

### Modify Document Sources
Update URLs in `tools.js` to point to your desired sources.

### Adjust Chunks
Modify `chunkSize` and `chunkOverlap` in `documents.js` to change how documents are split.

## Troubleshooting

### Common Issues
- **Model not found**: Ensure all required models are downloaded
- **Connection errors**: Verify Ollama server is running
- **Memory issues**: Reduce chunk size for large documents