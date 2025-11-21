// tools.js - Tool integration for the RAG agent

import { DynamicTool } from "@langchain/core/tools";
import { loadDocumentsFromUrls, splitDocuments, createVectorStore } from "./documents.js";

// Create a tool for document retrieval
const retrieverTool = new DynamicTool({
  name: "document_retriever",
  description: "Use this tool to search through documents for relevant information to answer user questions.",
  func: async (query) => {
    console.log(`Using retriever tool for query: ${query}`);
    
    // Define sample URLs to search
    const urls = [
      "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "https://en.wikipedia.org/wiki/Machine_learning"
    ];
    
    try {
      // Load and process documents
      const documents = await loadDocumentsFromUrls(urls);
      const splits = await splitDocuments(documents);
      const vectorStore = await createVectorStore(splits);
      
      // Perform similarity search
      const retriever = vectorStore.asRetriever();
      const docs = await retriever.invoke(query);
      
      // Return the retrieved content
      return docs.map(doc => doc.pageContent).join("\n\n");
    } catch (error) {
      console.error("Error in retriever tool:", error);
      return "Error retrieving documents";
    }
  },
});

export { retrieverTool };