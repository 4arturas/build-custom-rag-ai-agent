import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const EMBEDDING_MODEL = "mxbai-embed-large";
const LLM_MODEL = "llama3.2:3b";
const DOCUMENT_URL = "https://en.wikipedia.org/wiki/Artificial_intelligence";

async function simpleRagExample(userQuestion) {
  console.log("1. RETRIEVE: Loading and processing documents...");

  const loader = new CheerioWebBaseLoader(DOCUMENT_URL);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const splits = await splitter.splitDocuments(docs);

  console.log("2. EMBED: Converting text to searchable vectors...");
  const embeddings = new OllamaEmbeddings({
    model: EMBEDDING_MODEL,
  });

  // const vectorStore = await HNSWLib.fromDocuments(splits, embeddings);
  // const retriever = vectorStore.asRetriever();

  const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings);
  const retriever = vectorStore.asRetriever();

  console.log("3. RETRIEVE: Finding relevant documents for the question...");
  const relevantDocs = await retriever.invoke(userQuestion);

  console.log("4. GENERATE: Creating an answer using context and LLM...");
  const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

  const prompt = PromptTemplate.fromTemplate(
    `Answer based on context:\n\n{context}\n\nQuestion: {question}`
  );

  const model = new ChatOllama({
    model: LLM_MODEL,
    temperature: 0
  });

  const chain = prompt.pipe(model);
  const response = await chain.invoke({
    context: context,
    question: userQuestion
  });

  console.log("5. RESULT: RAG-generated answer:");
  return response.content;
}

console.log("Starting tutorial.js execution...");
const startTime = Date.now();
simpleRagExample("What is artificial intelligence?")
  .then(answer => {
    const endTime = Date.now();
    console.log(answer);
    console.log(`\nExecution time: ${endTime - startTime}ms`);
  })
  .catch(console.error);