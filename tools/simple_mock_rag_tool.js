import { DynamicTool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import MODEL_CONFIG from "../model_constants.js";

async function simpleMockRagTool(question) {
  console.log(`Setting up mock RAG tool to answer: "${question}"`);
  
  // Create a mock tool that simulates RAG functionality
  const mockRagTool = new DynamicTool({
    name: "mock_rag_tool",
    description: "A mock tool that simulates Retrieval-Augmented Generation",
    func: async (input) => {
      // Handle input flexibly based on how LangChain processes arguments
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

      // Simulate document retrieval and processing
      console.log(`Simulating document retrieval for: ${question}`);

      // Mock context based on the question
      let context = "";
      if (question.toLowerCase().includes("artificial intelligence") || question.toLowerCase().includes("ai")) {
        context = "Artificial Intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of 'intelligent agents': any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.";
      } else if (question.toLowerCase().includes("machine learning") || question.toLowerCase().includes("ml")) {
        context = "Machine learning (ML) is a type of artificial intelligence that allows software applications to become more accurate at predicting outcomes without being explicitly programmed to do so. Machine learning algorithms use historical data as input to predict new output values.";
      } else {
        context = "This is a mock context that simulates information retrieved from documents. In a real RAG system, this would contain relevant information from a knowledge base that helps answer the question.";
      }

      const mockResponse = `Based on the retrieved context: "${context}", the answer to "${question}" is simulated. In a real RAG system, an LLM would generate a comprehensive answer using both the context and the question.`;

      return mockResponse;
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

  // Use a model to properly handle the tool call
  const model = new ChatOllama({
    model: MODEL_CONFIG.LLM.DEFAULT,
    temperature: 0
  });

  const modelWithTools = model.bindTools([mockRagTool]);
  const toolNode = new ToolNode([mockRagTool]);

  console.log("Using mock RAG tool to answer the question...\n");
  let response = await modelWithTools.invoke(question);

  // If the response contains tool calls, execute them
  if (response.tool_calls && response.tool_calls.length > 0) {
    // Format the response as messages for ToolNode
    const messages = [response];
    const toolResponse = await toolNode.invoke({ messages });

    // Return the result from the tool execution
    return toolResponse.messages[0].content;
  }

  return response.content || JSON.stringify(response);
}

async function runExample() {
  console.log("=== Simple Mock RAG Tool Example ===\n");
  
  try {
    const question = "What is artificial intelligence?";
    console.log(`Asking: ${question}`);
    
    const startTime = Date.now();
    const answer = await simpleMockRagTool(question);
    const endTime = Date.now();
    
    console.log("\n=== Final Answer ===");
    console.log(answer);
    console.log(`\nTotal time: ${endTime - startTime}ms`);
    
    // Try another question
    console.log("\n" + "=".repeat(40));
    const question2 = "What is machine learning?";
    console.log(`Asking: ${question2}`);
    
    const answer2 = await simpleMockRagTool(question2);
    
    console.log("\n=== Final Answer ===");
    console.log(answer2);
  } catch (error) {
    console.error("Error running mock RAG tool:", error);
    console.error("Error stack:", error.stack);
  }
}

runExample();