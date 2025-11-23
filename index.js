import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import readline from 'readline/promises';
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createRetrieverTool } from "langchain/tools/retriever";

// Define the state structure for our RAG workflow (following the tutorial pattern)
const GraphState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
};

// Initialize models
const model = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0,
});

const generationModel = new ChatOllama({
  model: "deepseek-r1:8b",
  temperature: 0,
});

// Create embeddings and retriever
let retriever = null;

async function createRetriever() {
  if (!retriever) {
    console.log("Setting up document retriever...");

    // Define URLs to load documents from
    const urls = [
      "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "https://en.wikipedia.org/wiki/Machine_learning",
      "https://en.wikipedia.org/wiki/Deep_learning"
    ];

    // Load documents
    const docs = await Promise.all(
      urls.map((url) => new CheerioWebBaseLoader(url).load()),
    );
    const docsList = docs.flat();

    // Split documents
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const allSplits = await splitter.splitDocuments(docsList);
    console.log(`Split blog posts into ${allSplits.length} sub-documents.`);

    // Create embeddings
    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large",
    });

    // Create vector store
    const vectorStore = await MemoryVectorStore.fromDocuments(
      allSplits,
      embeddings,
    );

    // Create retriever
    retriever = vectorStore.asRetriever();
    console.log("Document retriever set up successfully.");
  }

  return retriever;
}

// Create a retriever tool
async function initializeRetrieverTool() {
  const retriever = await createRetriever();

  return createRetrieverTool(
    retriever,
    {
      name: "search_documents",
      description: "Search and return information from documents.",
    },
  );
}

// Agent node that decides the next action
async function agent(state) {
  console.log("---CALL AGENT---");

  const { messages } = state;
  const filteredMessages = messages.filter((message) => {
    if (message._getType() === "ai" && message.tool_calls?.length) {
      // Filter out relevance scoring tool calls
      return message.tool_calls[0].name !== "give_relevance_score";
    }
    return true;
  });

  // Get the retriever tool
  const tool = await initializeRetrieverTool();

  // Create a model that can use tools
  const modelWithTools = model.bindTools([tool]);

  const response = await modelWithTools.invoke(filteredMessages);
  return {
    messages: [response],
  };
}

// Function to determine if retrieval is needed
function shouldRetrieve(state) {
  console.log("---DECIDE TO RETRIEVE---");
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (lastMessage._getType() === "ai" && lastMessage.tool_calls?.length) {
    console.log("---DECISION: RETRIEVE---");
    return "retrieve";
  }

  return "end";
}

// Grade the retrieved documents for relevance
async function gradeDocuments(state) {
  console.log("---GET RELEVANCE---");

  const relevanceTool = {
    name: "give_relevance_score",
    description: "Give a relevance score to the retrieved documents.",
    schema: z.object({
      binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
    }),
  };

  const prompt = PromptTemplate.fromTemplate(
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

  const graderModel = new ChatOllama({
    model: "llama3.2:3b",
    temperature: 0,
  }).bindTools([relevanceTool]);

  const { messages } = state;
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  const chain = prompt.pipe(graderModel);

  const score = await chain.invoke({
    question: firstMessage.content,
    context: lastMessage.content,
  });

  return {
    messages: [score],
  };
}

// Check the relevance of documents
function checkRelevance(state) {
  console.log("---CHECK RELEVANCE---");

  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (lastMessage._getType() !== "ai") {
    throw new Error(
      "The 'checkRelevance' node requires the most recent message to be an AI message."
    );
  }

  const { tool_calls: toolCalls } = lastMessage;
  if (!toolCalls || !toolCalls.length) {
    throw new Error(
      "The 'checkRelevance' node requires the most recent message to contain tool calls."
    );
  }

  if (toolCalls[0].args.binaryScore === "yes") {
    console.log("---DECISION: DOCS RELEVANT---");
    return "yes";
  }
  console.log("---DECISION: DOCS NOT RELEVANT---");
  return "no";
}

// Rewrite the query if documents are not relevant
async function rewrite(state) {
  console.log("---TRANSFORM QUERY---");

  const { messages } = state;
  const question = messages[0].content;

  const prompt = PromptTemplate.fromTemplate(
    `
Look at the input and try to reason about the underlying semantic intent / meaning.

Here is the initial question:

-------

{question}

-------

Formulate an improved question:`,
  );

  const response = await prompt.pipe(generationModel).invoke({ question });
  return {
    messages: [response],
  };
}

// Generate the final response
async function generate(state) {
  console.log("---GENERATE---");

  const { messages } = state;
  const question = messages[0].content;

  // Extract the most recent ToolMessage
  const lastToolMessage = messages.slice().reverse().find((msg) =>
    msg._getType() === "tool"
  );
  if (!lastToolMessage) {
    throw new Error("No tool message found in the conversation history");
  }

  const context = lastToolMessage.content;

  const prompt = PromptTemplate.fromTemplate(
    `
You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.

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

  const ragChain = prompt.pipe(generationModel);

  const response = await ragChain.invoke({
    context,
    question,
  });

  return {
    messages: [response],
  };
}

// Main function to run the RAG agent
async function runRagAgent() {
  console.log("Setting up RAG agent...\n");

  // Initialize the retriever tool
  const tool = await initializeRetrieverTool();

  // Create the tool node
  const toolNode = new ToolNode([tool]);

  // Create the graph following the tutorial pattern
  const workflow = new StateGraph(GraphState);

  // Add nodes
  workflow
    .addNode("agent", agent)
    .addNode("retrieve", toolNode)
    .addNode("gradeDocuments", gradeDocuments)
    .addNode("rewrite", rewrite)
    .addNode("generate", generate);

  // Add edges and conditional logic
  workflow
    .addEdge(START, "agent")
    .addConditionalEdges(
      "agent",
      shouldRetrieve
    )
    .addEdge("retrieve", "gradeDocuments")
    .addConditionalEdges(
      "gradeDocuments",
      checkRelevance,
      {
        yes: "generate",
        no: "rewrite",
      }
    )
    .addEdge("generate", END)
    .addEdge("rewrite", "agent");

  // Compile the graph
  const app = workflow.compile();

  // Get user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const query = await rl.question('Enter your question: ');
  rl.close();

  console.log(`\nQuery: ${query}`);
  console.log("Processing...\n");

  try {
    // Prepare inputs with HumanMessage
    const inputs = {
      messages: [
        new HumanMessage(query),
      ],
    };

    // Run the RAG workflow
    let finalState;
    for await (const output of await app.stream(inputs)) {
      for (const [key, value] of Object.entries(output)) {
        console.log(`${key} -->`);
        finalState = value;
      }
    }

    // Extract and display the final response
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    console.log("Response:", lastMessage.content);

  } catch (error) {
    console.error("Error running RAG agent:", error);
  }
}

// Run the agent if this file is executed directly
// if (import.meta.url === `file://${process.argv[1]}`)
{
  runRagAgent().catch(console.error);
}