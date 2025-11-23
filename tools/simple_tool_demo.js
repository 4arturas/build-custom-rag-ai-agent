import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { START, END } from "@langchain/langgraph";
import { HumanMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { DynamicTool } from "@langchain/core/tools";

import MODEL_CONFIG from "../model_constants.js";

// Define state structure using Annotation
const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

async function createDocumentRetrieverTool() {
  const embeddings = new OllamaEmbeddings({
    model: MODEL_CONFIG.EMBEDDING.DEFAULT,
  });

  const urls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://en.wikipedia.org/wiki/Machine_learning"
  ];

  const docs = await Promise.all(
    urls.map((url) => new CheerioWebBaseLoader(url).load()),
  );
  const docsList = docs.flat();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: MODEL_CONFIG.DOCUMENT_RETRIEVAL.CHUNK_SIZE,
    chunkOverlap: MODEL_CONFIG.DOCUMENT_RETRIEVAL.CHUNK_OVERLAP,
  });
  const allSplits = await splitter.splitDocuments(docsList);

  const vectorStore = await MemoryVectorStore.fromDocuments(allSplits, embeddings);
  const retriever = vectorStore.asRetriever();

  // Create a custom tool using LangChain's DynamicTool
  const retrieverTool = new DynamicTool({
    name: "search_documents",
    description: "Search and return information from documents.",
    func: async (input) => {
      try {
        // Handle input flexibly based on how LangChain processes arguments
        let query;
        if (typeof input === 'string') {
          query = input;
        } else if (typeof input === 'object' && input !== null) {
          // The LLM may generate different parameter names than what we specified in the schema
          // Check for various possible parameter names
          query = input.query || input.question || input.text || input.input;
        } else {
          query = JSON.stringify(input);
        }

        // Clean and validate the query before passing it to the retriever
        if (!query || typeof query !== 'string') {
          throw new Error('Invalid query: query must be a non-empty string');
        }

        // Sanitize the query to ensure it's a valid input for the embedding model
        const sanitizedQuery = query.trim().substring(0, 1000); // Limit length to prevent issues
        if (sanitizedQuery.length === 0) {
          throw new Error('Invalid query: query is empty after sanitization');
        }

        const results = await retriever.invoke(sanitizedQuery);
        if (!results || results.length === 0) {
          return "No relevant documents found for the query.";
        }

        // Sanitize results before returning them
        const processedResults = results.map(r => {
          // Ensure the pageContent is a string and not too long
          let content = r.pageContent;
          if (typeof content !== 'string') {
            content = String(content);
          }
          // Limit content length to prevent excessive output
          return content.substring(0, 2000);
        });

        return processedResults.join("\n\n");
      } catch (error) {
        console.error("Error in retriever tool:", error);
        return `Error retrieving documents: ${error.message}`;
      }
    },
    schema: z.object({
      query: z.string().describe("The query to search for in the documents"),
    }),
  });

  return retrieverTool;
}

async function createToolNode() {
  const tool = await createDocumentRetrieverTool();
  return new ToolNode([tool]);
}

async function agent(state) {
  console.log("Agent: Analyzing message to decide on action");

  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.AGENT,
    temperature: 0,
  });

  // Create the tool once and cache it, or pass the right query to it
  const tool = await createDocumentRetrieverTool();
  const modelWithTools = model.bindTools([tool]);

  const response = await modelWithTools.invoke(messages);

  return { messages: [response] };
}

function shouldUseTool(state) {
  console.log("Checking if tool should be used...");
  
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  
  // If the last message was from an AI and has tool calls, 
  // we need to execute those tools
  if (lastMessage._getType() === "ai" && lastMessage.tool_calls?.length) {
    console.log("Tool should be used");
    return "use_tool";
  }
  
  return "no_tool";
}

async function generate(state) {
  console.log("Generating final response...");
  
  const { messages } = state;
  const userQuestion = messages[0].content;
  
  // Find the tool response
  const toolResponse = messages.find(msg => msg._getType() === "tool");
  const context = toolResponse ? toolResponse.content : "No context from tools";
  
  const prompt = PromptTemplate.fromTemplate(
    `
Based on the following context, answer the question. Keep your answer concise.
Question: {question}
Context: {context}
Answer:`
  );
  
  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.GENERATION,
    temperature: 0,
  });
  
  const chain = prompt.pipe(model);
  const response = await chain.invoke({
    question: userQuestion,
    context: context
  });
  
  return { messages: [response] };
}

async function demonstrateTools() {
  console.log("=== Demonstrating Tool Usage in RAG AI Agent ===\n");
  
  const toolNode = await createToolNode();
  
  const workflow = new StateGraph(GraphState)
    .addNode("agent", agent)
    .addNode("tool", toolNode)
    .addNode("generate", generate);
  
  workflow
    .addEdge(START, "agent")
    .addConditionalEdges(
      "agent",
      shouldUseTool,
      {
        use_tool: "tool",
        no_tool: "generate"
      }
    )
    .addEdge("tool", "generate")
    .addEdge("generate", END);
  
  const app = workflow.compile();
  
  const inputs = {
    messages: [
      new HumanMessage("What are the main applications of machine learning?")
    ]
  };
  
  console.log("Query: What are the main applications of machine learning?\n");
  console.log("Running RAG agent with tools...\n");
  
  let finalState;
  for await (const output of await app.stream(inputs)) {
    for (const [key, value] of Object.entries(output)) {
      console.log(`${key} -->`);
      finalState = value;
    }
  }
  
  const lastMessage = finalState.messages[finalState.messages.length - 1];
  console.log("\nFinal Response:");
  console.log(lastMessage.content);
}

demonstrateTools().catch(console.error);