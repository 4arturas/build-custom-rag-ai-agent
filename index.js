// Import required modules from LangChain and LangGraph
import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Import document processing functions and tools
import { loadDocumentsFromUrls, splitDocuments, createVectorStore } from "./documents.js";
import { gradeDocuments } from "./grader.js";
import { retrieverTool } from "./tools.js";

// Define the state structure for our RAG agent
const StateAnnotation = {
  messages: {
    default: () => [],
    reducer: (x, y) => x.concat(y)
  },
  keys: {
    default: () => ({}),
    reducer: (x, y) => ({...x, ...y})
  }
};

// Define models to be used
const model = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0,
});

const generationModel = new ChatOllama({
  model: "deepseek-r1:8b",
  temperature: 0,
});

// Function to check if retrieval is needed
async function shouldRetrieve(state) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1].content;

  // Simple heuristic to decide if we need to retrieve documents
  const retrievalKeywords = ["what", "who", "when", "where", "how", "why", "explain", "describe"];
  const lowerMsg = lastMessage.toLowerCase();

  for (const keyword of retrievalKeywords) {
    if (lowerMsg.includes(keyword)) {
      return "retrieve";
    }
  }
  return "generate";
}

// Function to grade document relevance
async function gradeDocumentsNode(state) {
  const { keys, messages } = state;
  const question = messages[messages.length - 1].content;
  const documents = keys.documents || [];

  // Use the imported grading function to filter relevant documents
  const filteredDocs = await gradeDocuments(question, documents);

  return { keys: { filtered_docs: filteredDocs } };
}

// Define the tool schema using Zod
const toolSchema = z.object({
  action: z.string().describe("The name of the tool to use"),
  action_input: z.string().describe("The input for the tool"),
});

// Function for the agent to decide next action
async function agent(state) {
  const { messages } = state;

  // Create a prompt for the agent to decide what to do
  const prompt = PromptTemplate.fromTemplate(`
    You are a research assistant for question-answering tasks.
    Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.

    {context}

    Question: {question}

    Given the context and question, decide whether to:
    1. Generate an answer directly, or
    2. Use the document_retriever tool to search for more information

    Respond with your choice and reasoning.
  `);

  // In a real implementation, we'd use a more sophisticated approach
  // For now, let's use a simple approach to determine if we need to retrieve
  const lastMessage = messages[messages.length - 1].content;
  const needsRetrieval = lastMessage.toLowerCase().includes("what") ||
                        lastMessage.toLowerCase().includes("who") ||
                        lastMessage.toLowerCase().includes("how") ||
                        lastMessage.toLowerCase().includes("explain");

  // If it's a factual question, suggest using the tool
  if (needsRetrieval) {
    // Return a message indicating we want to use the retriever tool
    return {
      messages: [{
        role: "assistant",
        content: "Need to retrieve information to answer this question.",
        tool_calls: [{ name: "document_retriever", args: { query: lastMessage } }]
      }]
    };
  } else {
    // For non-factual questions, try to generate a response directly
    const response = await generationModel.invoke([
      { role: "user", content: `Respond to this query: ${lastMessage}` }
    ]);

    return { messages: [response] };
  }
}

// Function to rewrite query for better retrieval
async function rewrite(state) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1].content;

  // For simplicity, we'll return the original query
  // In a real implementation, this would rephrase the query for better retrieval
  const response = await model.invoke([
    { role: "user", content: `Rewrite this query to be more specific for document search: ${lastMessage}` }
  ]);

  return { keys: { query: response.content } };
}

// Function to generate final response based on retrieved documents
async function generate(state) {
  const { messages, keys } = state;
  const docs = keys.filtered_docs || [];
  const question = messages[messages.length - 1].content;

  // Combine documents content
  const context = docs.map(doc => doc.pageContent).join("\n\n");

  // Create a prompt with context and question
  const prompt = PromptTemplate.fromTemplate(`
    Answer the question based on the context below:
    Context: {context}
    Question: {question}
    Answer:
  `);

  const chain = prompt.pipe(generationModel).pipe(new StringOutputParser());

  const response = await chain.invoke({
    context: context,
    question: question
  });

  return { messages: [response] };
}

// Function to retrieve documents based on query
async function retrieve(state) {
  const { keys, messages } = state;
  const query = keys.query || messages[messages.length - 1].content;

  console.log(`Retrieving documents for query: ${query}`);

  // Load documents from sample URLs (replace with your own URLs)
  const urls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://en.wikipedia.org/wiki/Machine_learning"
  ];

  try {
    // Load documents
    const documents = await loadDocumentsFromUrls(urls);

    // Split documents
    const splits = await splitDocuments(documents);

    // Create vector store
    const vectorStore = await createVectorStore(splits);

    // Perform similarity search
    const retriever = vectorStore.asRetriever();
    const docs = await retriever.invoke(query);

    return { keys: { documents: docs } };
  } catch (error) {
    console.error("Error during document retrieval:", error);
    return { keys: { documents: [] } };
  }
}

// Create the workflow graph - following the tutorial pattern:
// agent decides -> if needs retrieval, go to retrieve -> grade docs -> generate
// if no retrieval needed, go directly to generate
const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", agent)
  .addNode("retrieve", retrieve)
  .addNode("gradeDocuments", gradeDocumentsNode)
  .addNode("generate", generate)
  .addNode("rewrite", rewrite)
  .addEdge(START, "agent")
  .addConditionalEdges(
    "agent",
    // Check if the agent decided to use tools (retrieve)
    (state) => {
      const { messages } = state;
      const lastMessage = messages[messages.length - 1];

      // If the agent has tool calls, we need to retrieve documents
      if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "retrieve";
      }
      // Otherwise proceed to generate
      return "generate";
    },
    {
      retrieve: "retrieve",
      generate: "generate"
    }
  )
  .addEdge("retrieve", "gradeDocuments")
  .addEdge("gradeDocuments", "generate")
  .addEdge("generate", END);

// Compile the graph
const app = workflow.compile();

// Test function
async function runRagAgent() {
  console.log("Starting RAG agent...");

  // Example query
  const query = "What is artificial intelligence?";

  console.log(`Query: ${query}`);

  try {
    // Run the agent
    const result = await app.invoke({
      messages: [{ role: "user", content: query }]
    });

    console.log("Response:", result.messages[result.messages.length - 1].content);
  } catch (error) {
    console.error("Error running RAG agent:", error);
  }
}

// Run the agent if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRagAgent().catch(console.error);
}

export default app;