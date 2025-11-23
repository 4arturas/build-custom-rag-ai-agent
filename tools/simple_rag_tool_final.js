import { Tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import MODEL_CONFIG from "../model_constants.js";

class SimpleRagTool extends Tool {
  name = "simple_rag_tool";
  description = "Answers questions based on retrieved context from documents using RAG (Retrieval-Augmented Generation)";

  constructor(url = "https://en.wikipedia.org/wiki/Artificial_intelligence") {
    super();
    this.url = url;
    this.retriever = null;
  }

  async initialize() {
    console.log(`Loading documents from: ${this.url}`);
    const loader = new CheerioWebBaseLoader(this.url);
    const docs = await loader.load();
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const splits = await splitter.splitDocuments(docs);
    console.log(`Loaded and split ${splits.length} document chunks`);

    const embeddings = new OllamaEmbeddings({ model: MODEL_CONFIG.EMBEDDING.DEFAULT });
    const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings);
    this.retriever = vectorStore.asRetriever();
    
    console.log("RAG tool initialized successfully");
  }

  async _call(question) {
    if (!this.retriever) {
      await this.initialize();
    }

    console.log(`Retrieving documents for question: ${question}`);
    
    const relevantDocs = await this.retriever.invoke(question);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    console.log(`Retrieved ${relevantDocs.length} relevant documents`);
    
    console.log("Creating model and generating answer...");
    const model = new ChatOllama({ model: MODEL_CONFIG.LLM.DEFAULT, temperature: 0 });
    const prompt = PromptTemplate.fromTemplate(
      "Answer based on context: {context}\n\nQuestion: {question}\n\nAnswer:"
    );
    
    const chain = prompt.pipe(model);
    const response = await chain.invoke({ context, question });
    
    return response.content;
  }
}

async function simpleRagTool(question, url = "https://en.wikipedia.org/wiki/Artificial_intelligence") {
  console.log(`Setting up RAG tool to answer: "${question}"`);
  
  const ragTool = new SimpleRagTool(url);
  
  // Use the tool to answer the question
  console.log("Using RAG tool to answer the question...\n");
  const result = await ragTool.invoke(question);
  
  return result;
}

async function runExample() {
  console.log("=== Simple RAG Tool Example ===\n");
  
  try {
    const question = "What is artificial intelligence?";
    console.log(`Asking: ${question}`);
    
    const startTime = Date.now();
    const answer = await simpleRagTool(question);
    const endTime = Date.now();
    
    console.log("\n=== Final Answer ===");
    console.log(answer);
    console.log(`\nTotal time: ${endTime - startTime}ms`);
  } catch (error) {
    console.error("Error running RAG tool:", error);
    console.error("Error stack:", error.stack);
  }
}

runExample();
