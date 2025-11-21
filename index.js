// Import required modules from LangChain and LangGraph
import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { MessageGraph } from "@langchain/langgraph";
import { END } from "@langchain/langgraph";

// Define models to be used
const model = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0,
});

const embeddingModel = new ChatOllama({
  model: "mxbai-embed-large",
});

// Simple greeting function for initial test
async function greet() {
  const response = await model.invoke("Hello, how are you?");
  console.log(response.content);
}

// Test the model connection
console.log("Testing model connection...");
await greet();

export default { greet };