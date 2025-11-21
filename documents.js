// documents.js - Document processing module for RAG agent

import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/ollama";

// Function to load and process documents from URLs
async function loadDocumentsFromUrls(urls) {
  const documents = [];
  
  for (const url of urls) {
    try {
      console.log(`Loading document from: ${url}`);
      const loader = new CheerioWebBaseLoader(url);
      const loadedDocs = await loader.load();
      documents.push(...loadedDocs);
    } catch (error) {
      console.error(`Error loading document from ${url}:`, error);
    }
  }
  
  return documents;
}

// Function to split documents into chunks
async function splitDocuments(documents) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  
  return await splitter.splitDocuments(documents);
}

// Function to create embeddings and vector store
async function createVectorStore(splits) {
  // Initialize Ollama embeddings
  const embeddings = new OllamaEmbeddings({
    model: "mxbai-embed-large",
  });
  
  // Import VectorStore from community package
  // Note: We'll use in-memory vector store for this example
  const { MemoryVectorStore } = await import("@langchain/community/vectorstores/memory");
  
  // Create vector store from documents
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splits,
    embeddings
  );
  
  return vectorStore;
}

export { loadDocumentsFromUrls, splitDocuments, createVectorStore };