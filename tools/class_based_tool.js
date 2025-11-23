import { Tool } from "@langchain/core/tools";

class MockRagTool extends Tool {
  name = "mock_rag_tool";
  description = "A mock tool that simulates Retrieval-Augmented Generation";

  constructor() {
    super();
  }

  async _call(input) {
    console.log(`Processing input:`, input);
    return `This is a mock response to the input: "${input}". In a real RAG system, this would be generated using retrieved context from documents.`;
  }
}

async function simpleMockRagTool(question) {
  console.log(`Question received: ${question}`);
  
  // Create a mock tool
  const mockRagTool = new MockRagTool();
  
  console.log("Using mock RAG tool...");
  const result = await mockRagTool.invoke(question);
  console.log("Result received");
  
  return result;
}

async function runExample() {
  console.log("Simple Mock RAG Tool Example");
  
  try {
    const question = "What is artificial intelligence?";
    console.log(`Asking: ${question}`);
    
    const answer = await simpleMockRagTool(question);
    
    console.log("Final Answer:");
    console.log(answer);
  } catch (error) {
    console.error("Error:", error);
  }
}

console.log("Starting example...");
runExample().then(() => console.log("Done"));