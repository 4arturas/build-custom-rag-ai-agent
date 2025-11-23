// rag_agent_with_tools.js - Complete RAG AI Agent with Tool Implementation
// Based on the Deno blog tutorial "Build Custom RAG AI Agent"

import { OllamaEmbeddings } from "@langchain/ollama";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import { isAIMessage, isToolMessage, HumanMessage } from "@langchain/core/messages";
import { END } from "@langchain/langgraph";
import { z } from "zod";
import { StateGraph } from "@langchain/langgraph";
import { START } from "@langchain/langgraph";

import MODEL_CONFIG from "../model_constants.js";

// 1. Document Gathering and Processing
// This function creates the vector store and retriever as described in the tutorial
async function setupDocuments() {
  console.log("Setting up documents for RAG agent...");

  // Create embeddings using the specified model
  const embeddings = new OllamaEmbeddings({
    model: MODEL_CONFIG.EMBEDDING.DEFAULT, // Used for creating document embeddings
  });

  // URLs from which to gather documents
  const urls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://en.wikipedia.org/wiki/Machine_learning", 
    "https://en.wikipedia.org/wiki/Deep_learning"
  ];

  // Load documents from URLs
  const docs = await Promise.all(
    urls.map((url) => new CheerioWebBaseLoader(url).load()),
  );
  const docsList = docs.flat();

  // Split documents into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,    // As specified in the tutorial
    chunkOverlap: 50,  // As specified in the tutorial
  });
  const allSplits = await splitter.splitDocuments(docsList);
  console.log(`Split documents into ${allSplits.length} sub-documents.`);

  // Create vector store and retriever
  const vectorStore = await MemoryVectorStore.fromDocuments(
    allSplits,
    embeddings,
  );

  return vectorStore.asRetriever();
}

// 2. Graph State Management
// Define the state structure for our RAG workflow as shown in the tutorial
const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),  // Combine message arrays
    default: () => [],               // Default to empty array
  }),
});

// 3. Tool Creation
// Create the retriever tool as shown in the tutorial
async function createRetrieverToolNode() {
  const retriever = await setupDocuments();

  // Create a custom tool that uses the retriever
  const retrieverTool = {
    name: "retrieve_blog_posts",
    description: "Search and return information from documents.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query to search for in the documents",
        },
      },
      required: ["query"],
    },
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
  };

  // Create the tool node using LangGraph's prebuilt ToolNode
  const tools = [retrieverTool];
  return new ToolNode(tools);
}

// 4. Workflow Components (Nodes) - Implementation from Tutorial

// Node to decide whether to retrieve documents
function shouldRetrieve(state) {
  console.log("---DECIDE TO RETRIEVE---");
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  // Check if the last message from the AI included tool calls
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    console.log("---DECISION: RETRIEVE---");
    return "retrieve";
  }

  return END;
}

// Node to grade the relevance of retrieved documents
async function gradeDocuments(state) {
  console.log("---GET RELEVANCE---");

  // Define the relevance scoring tool
  const relevanceTool = {
    name: "give_relevance_score",
    description: "Give a relevance score to the retrieved documents.",
    schema: z.object({
      binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
    }),
  };

  // Create a prompt to evaluate document relevance
  const prompt = ChatPromptTemplate.fromTemplate(
    `You are a grader assessing relevance of retrieved docs to a user question.
  Here are the retrieved docs:
  
  -------
  
  {context} 
  
  -------
  
  Here is the user question: {question}
  
  If the content of the docs are relevant to the users question, score them as relevant.
  Give a binary score 'yes' or 'no' score to indicate whether the docs are relevant to the question.
  Yes: The docs are relevant to the question.
  No: The docs are not relevant to the question.`,
  );

  // Create a model that can use the relevance tool
  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.AGENT,  // As specified in the tutorial
    temperature: 0,
  }).bindTools([relevanceTool]);

  const { messages } = state;
  const firstMessage = messages[0];      // The original user query
  const lastMessage = messages[messages.length - 1];  // Retrieved documents

  const chain = prompt.pipe(model);

  const score = await chain.invoke({
    question: firstMessage.content,
    context: lastMessage.content,
  });

  return {
    messages: [score],
  };
}

// Node to check the relevance of documents based on the score
function checkRelevance(state) {
  console.log("---CHECK RELEVANCE---");

  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  
  if (!isAIMessage(lastMessage)) {
    throw new Error(
      "The 'checkRelevance' node requires the most recent message to be an AI message.",
    );
  }

  const { tool_calls: toolCalls } = lastMessage;
  if (!toolCalls || !toolCalls.length) {
    throw new Error(
      "The 'checkRelevance' node requires the most recent message to contain tool calls.",
    );
  }

  if (toolCalls[0].args.binaryScore === "yes") {
    console.log("---DECISION: DOCS RELEVANT---");
    return "yes";
  }
  
  console.log("---DECISION: DOCS NOT RELEVANT---");
  return "no";
}

// Node that acts as the main agent, deciding next actions
async function agent(state) {
  console.log("---CALL AGENT---");

  const { messages } = state;
  
  // Filter out relevance scoring tool calls to avoid infinite loops
  const filteredMessages = messages.filter((message) => {
    if (isAIMessage(message) && message.tool_calls?.length) {
      return message.tool_calls[0].name !== "give_relevance_score";
    }
    return true;
  });

  // Create the tool node each time (or get a reference to the pre-created one)
  const tool = await createRetrieverToolNode();
  // In a real implementation, we'd likely create tools once and reuse them,
  // but for this example, we recreate the retriever to demonstrate the concept
  
  const retriever = await setupDocuments();

  // Create a custom tool that uses the retriever
  const retrieverTool = {
    name: "retrieve_blog_posts",
    description: "Search and return information from documents.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query to search for in the documents",
        },
      },
      required: ["query"],
    },
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
  };

  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.AGENT,  // As specified in the tutorial
    temperature: 0,
    streaming: true,
  }).bindTools([retrieverTool]);

  const response = await model.invoke(filteredMessages);
  return {
    messages: [response],
  };
}

// Node to rewrite the query if documents weren't relevant
async function rewrite(state) {
  console.log("---TRANSFORM QUERY---");

  const { messages } = state;
  const question = messages[0].content;
  
  const prompt = ChatPromptTemplate.fromTemplate(
    `Look at the input and try to reason about the underlying semantic intent / meaning.
    
Here is the initial question:
    
-------
    
{question} 
    
-------
    
Formulate an improved question:`,
  );

  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.GENERATION,  // As specified in the tutorial
    temperature: 0,
    streaming: true,
  });
  
  const response = await prompt.pipe(model).invoke({ question });
  return {
    messages: [response],
  };
}

// Node to generate the final response based on context and question
async function generate(state) {
  console.log("---GENERATE---");

  const { messages } = state;
  const question = messages[0].content;
  
  // Extract the most recent ToolMessage (with retrieved documents)
  const lastToolMessage = messages.slice().reverse().find((msg) =>
    isToolMessage(msg)
  );
  
  if (!lastToolMessage) {
    throw new Error("No tool message found in the conversation history");
  }

  const context = lastToolMessage.content;

  const prompt = ChatPromptTemplate.fromTemplate(
    `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.

Here is the initial question:

-------

{question}

-------

Here is the context that you should use to answer the question:

-------

{context}

-------

Answer:`,
  );

  const llm = new ChatOllama({
    model: MODEL_CONFIG.LLM.GENERATION,  // As specified in the tutorial
    temperature: 0,
    streaming: true,
  });

  const ragChain = prompt.pipe(llm);

  const response = await ragChain.invoke({
    context,
    question,
  });

  return {
    messages: [response],
  };
}

// 5. Create and Compile the Workflow
async function createWorkflow() {
  console.log("Creating RAG agent workflow with tools...");
  
  // Create the tool node
  const toolNode = await createRetrieverToolNode();
  
  // Create the workflow graph
  const workflow = new StateGraph(GraphState)
    .addNode("agent", agent)
    .addNode("retrieve", toolNode)  // The tool node executes the retriever tool
    .addNode("gradeDocuments", gradeDocuments)
    .addNode("rewrite", rewrite)
    .addNode("generate", generate);

  // Add edges to connect nodes
  workflow.addEdge(START, "agent");
  
  // Conditional edge from agent to decide whether to retrieve
  workflow.addConditionalEdges(
    "agent",
    shouldRetrieve,
  );
  
  workflow.addEdge("retrieve", "gradeDocuments");
  
  // Conditional edges from gradeDocuments based on relevance
  workflow.addConditionalEdges(
    "gradeDocuments",
    checkRelevance,
    {
      yes: "generate",  // If documents are relevant, generate response
      no: "rewrite",    // If documents aren't relevant, rewrite query
    },
  );
  
  workflow.addEdge("generate", END);
  workflow.addEdge("rewrite", "agent");  // If query is rewritten, go back to agent

  // Compile the workflow
  return workflow.compile();
}

// 6. Example Usage
async function runRagAgent() {
  console.log("Starting RAG AI Agent with Tools...\n");
  console.log("This implementation demonstrates the tool usage pattern from the Deno tutorial.\n");
  
  try {
    // Create the workflow
    const app = await createWorkflow();
    
    // Example query
    const inputs = {
      messages: [
        new HumanMessage("What are the main applications of artificial intelligence?"),
      ],
    };

    console.log("Asking the agent: What are the main applications of artificial intelligence?\n");
    
    let finalState;
    for await (const output of await app.stream(inputs)) {
      for (const [key, value] of Object.entries(output)) {
        console.log(`${key} -->`);
        finalState = value;
      }
    }

    // Extract and display the final response
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    console.log("\nFinal response from agent:\n");
    console.log(lastMessage.content);
    
  } catch (error) {
    console.error("Error running the RAG agent:", error);
    console.log("\nMake sure:");
    console.log("1. Ollama is running (run 'ollama serve')");
    console.log("2. Required models are pulled ('ollama pull mxbai-embed-large', 'ollama pull llama3.2:3b', 'ollama pull deepseek-r1:8b')");
  }
}

// Export the main components for potential reuse
export {
  GraphState,
  setupDocuments,
  createRetrieverToolNode,
  agent,
  gradeDocuments,
  generate,
  createWorkflow,
  runRagAgent
};


runRagAgent();
