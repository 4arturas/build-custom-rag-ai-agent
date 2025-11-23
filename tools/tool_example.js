import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { START, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { DynamicTool } from "@langchain/core/tools";

import MODEL_CONFIG from "../model_constants.js";

const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

async function createRetriever() {
  console.log("Setting up document retriever with tools...");

  // Define URLs to load documents from (based on Deno tutorial)
  const urls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://en.wikipedia.org/wiki/Machine_learning",
    "https://en.wikipedia.org/wiki/Deep_learning"
  ];

  const docs = await Promise.all(
    urls.map((url) => new CheerioWebBaseLoader(url).load()),
  );
  const docsList = docs.flat();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const allSplits = await splitter.splitDocuments(docsList);
  console.log(`Split documents into ${allSplits.length} sub-documents.`);

  const embeddings = new OllamaEmbeddings({
    model: MODEL_CONFIG.EMBEDDING.DEFAULT,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    allSplits,
    embeddings,
  );

  return vectorStore.asRetriever();
}

async function createCustomTools() {
  const retriever = await createRetriever();

  // Create a retriever tool using LangChain's DynamicTool
  const retrieverTool = new DynamicTool({
    name: "search_documents",
    description: "Search and return information from documents.",
    func: async (input) => {
      // Handle input flexibly based on how LangChain processes arguments
      let query;
      if (typeof input === 'string') {
        query = input;
      } else if (typeof input === 'object' && input !== null) {
        // The LLM may generate different parameter names than what we specified in the schema
        // Check for the parameter name that the LLM actually generated
        query = input.query || input.question || input.text || input.input;
      } else {
        query = JSON.stringify(input);
      }
      const results = await retriever.invoke(query);
      return results.map(r => r.pageContent).join("\n\n");
    },
    schema: z.object({
      query: z.string().describe("The query to search for in the documents"),
    }),
  });

  // Create another custom tool - this could be any function that performs an action
  const calculatorTool = {
    name: "calculate",
    description: "Perform mathematical calculations.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "The mathematical operation to perform",
        },
        a: {
          type: "number",
          description: "First number",
        },
        b: {
          type: "number",
          description: "Second number",
        },
      },
      required: ["operation", "a", "b"],
    },
    func: async ({ operation, a, b }) => {
      let result;

      switch(operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          result = b !== 0 ? a / b : "Error: Division by zero";
          break;
        default:
          return "Unknown operation";
      }

      return `The result of ${a} ${operation} ${b} is ${result}.`;
    },
  };

  return [retrieverTool, calculatorTool];
}

// Create a function that acts as a tool handler for custom tools
async function handleCustomTool(toolName, toolArgs) {
  if (toolName === "calculate") {
    const { operation, a, b } = toolArgs;
    let result;

    switch(operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        result = b !== 0 ? a / b : "Error: Division by zero";
        break;
      default:
        return "Unknown operation";
    }

    return `The result of ${a} ${operation} ${b} is ${result}.`;
  }

  return "Unknown tool";
}

// Agent node that decides which tool to use
async function agent(state) {
  console.log("---CALL AGENT---");

  const { messages } = state;
  const lastMessage = messages[messages.length - 1]?.content || "";

  const tools = await createCustomTools();
  const retrieverTool = tools[0];
  const calculatorTool = tools[1];

  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.AGENT,
    temperature: 0,
  });

  const modelWithTools = model.bindTools([retrieverTool, calculatorTool]);

  // Call the model with the messages
  const response = await modelWithTools.invoke(messages);
  
  return {
    messages: [response],
  };
}

function shouldUseTool(state) {
  console.log("---DECIDE TO USE TOOL---");
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (lastMessage._getType() === "ai" && lastMessage.tool_calls?.length) {
    console.log("---DECISION: USING TOOL---");
    return "tool";
  }

  console.log("---DECISION: NO TOOL NEEDED---");
  return "end";
}

// Tool execution node
async function executeTools(state) {
  console.log("---EXECUTE TOOLS---");

  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage.tool_calls || !lastMessage.tool_calls.length) {
    return { messages: [] };
  }

  const tools = await createCustomTools();
  const toolNames = tools.map(tool => tool.name);

  const results = [];

  for (const toolCall of lastMessage.tool_calls) {
    const { name, args, id } = toolCall;

    if (toolNames.includes(name)) {
      // For the retriever tool, LangChain will handle execution
      // For custom tools, we handle them specially
      if (name === "calculate") {
        const result = await handleCustomTool(name, args);
        results.push({
          tool_call_id: id,
          name: name,
          content: result,
        });
      }
    }
  }

  const { ToolMessage } = await import("@langchain/core/messages");
  const toolMessage = new ToolMessage({
    content: results.map(r => r.content).join("\n"),
    name: results[0]?.name || "tool",
    tool_call_id: results[0]?.tool_call_id || "",
  });

  return {
    messages: [toolMessage],
  };
}

async function generateResponse(state) {
  console.log("---GENERATE RESPONSE---");

  const { messages } = state;

  const prompt = PromptTemplate.fromTemplate(
    `
You are an AI assistant. Use the information from the tools to answer the user's question.
Conversation:
{messages}
Based on the information above, provide a helpful response:`
  );

  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.GENERATION,
    temperature: 0,
  });

  const chain = prompt.pipe(model);
  const formattedMessages = messages.map(msg => 
    `${msg._getType()}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}`
  ).join("\n");

  const response = await chain.invoke({ messages: formattedMessages });

  return {
    messages: [response],
  };
}

async function runToolExample() {
  console.log("Setting up RAG agent with tools...\n");

  // Create the graph
  const workflow = new StateGraph(GraphState);

  // Add nodes
  workflow
    .addNode("agent", agent)
    .addNode("tools", executeTools)
    .addNode("generate", generateResponse);

  // Add edges
  workflow
    .addEdge(START, "agent")
    .addConditionalEdges(
      "agent",
      shouldUseTool,
      {
        tool: "tools",
        end: "generate"
      }
    )
    .addEdge("tools", "generate")
    .addEdge("generate", END);

  const app = workflow.compile();

  // Example queries to demonstrate different tools
  const queries = [
    "What is artificial intelligence?",
    "Calculate 25 multiplied by 4",
    "What are the key concepts of machine learning?"
  ];

  for (const query of queries) {
    console.log(`\n--- Processing Query: ${query} ---`);
    
    // Prepare inputs
    const inputs = {
      messages: [
        new HumanMessage(query),
      ],
    };

    try {
      let finalState;
      for await (const output of await app.stream(inputs)) {
        for (const [key, value] of Object.entries(output)) {
          console.log(`${key} -->`);
          finalState = value;
        }
      }

      const lastMessage = finalState.messages[finalState.messages.length - 1];
      console.log("Final Response:", lastMessage.content);

    } catch (error) {
      console.error("Error running the agent:", error);
    }
  }
}

console.log("Welcome to the RAG AI Agent Tool Example!");
console.log("This demonstrates how to create and use tools in a RAG workflow.\n");

runToolExample().catch(console.error);