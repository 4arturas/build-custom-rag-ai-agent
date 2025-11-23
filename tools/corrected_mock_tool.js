import { DynamicTool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ToolMessage } from "@langchain/core/messages";
import MODEL_CONFIG from "../model_constants.js";

async function simpleMockRagTool(question) {
  console.log(`Question received: ${question}`);

  // Create a mock tool
  const mockRagTool = new DynamicTool({
    name: "mock_rag_tool",
    description: "A mock tool that simulates Retrieval-Augmented Generation",
    func: async (input) => {
      // Handle input flexibly based on how LangChain passes arguments
      let question;
      if (typeof input === 'string') {
        question = input;
      } else if (typeof input === 'object' && input !== null) {
        // The LLM may generate different parameter names than what we specified in the schema
        // Check for the parameter name that the LLM actually generated
        question = input.question || input.query || input.text || input.input;
      } else {
        question = JSON.stringify(input);
      }
      console.log(`Processing question: ${question}`);
      return `This is a mock response to the question: "${question}". In a real RAG system, this would be generated using retrieved context from documents.`;
    },
    schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to answer using document context",
        },
      },
      required: ["question"],
    }
  });

  // Use a model to generate tool calls
  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.DEFAULT,
    temperature: 0
  });

  const modelWithTools = model.bindTools([mockRagTool]);
  const toolNode = new ToolNode([mockRagTool]);

  console.log("Using mock RAG tool...");
  let response = await modelWithTools.invoke(question);

  // If the response contains tool calls, execute them
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log("Executing tool calls...");
    // Format the response as messages for ToolNode
    const messages = [response];
    const toolResponse = await toolNode.invoke({ messages });
    console.log("Tool execution completed");

    // Return the result from the tool execution
    return toolResponse.messages[0].content;
  }

  console.log("Result received");

  // Return the response content
  return response.content || JSON.stringify(response);
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