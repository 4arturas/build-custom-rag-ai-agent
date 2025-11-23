import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import MODEL_CONFIG from "../model_constants.js";

async function simpleRagTool(question, url = "https://en.wikipedia.org/wiki/Artificial_intelligence") {
  console.log(`Setting up RAG tool to answer: "${question}"`);


  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const splits = await splitter.splitDocuments(docs);

  console.log(`Loaded and split ${splits.length} document chunks`);

  const embeddings = new OllamaEmbeddings({ model: MODEL_CONFIG.EMBEDDING.DEFAULT });
  const vectorStore = await MemoryVectorStore.fromDocuments(splits, embeddings);
  const retriever = vectorStore.asRetriever();

  const ragTool = new DynamicTool({
    name: "rag_answer_tool",
    description: "Answers questions based on retrieved context from documents",
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

      console.log(`Retrieving documents for question: ${question}`);

      const relevantDocs = await retriever.invoke(question);
      const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

      const model = new ChatOllama({ model: MODEL_CONFIG.LLM.DEFAULT, temperature: 0 });
      const prompt = PromptTemplate.fromTemplate(
        "Answer based on context: {context}\n\nQuestion: {question}\n\nAnswer:"
      );

      const chain = prompt.pipe(model);
      const response = await chain.invoke({ context, question });

      return response.content;
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

  const modelWithTools = model.bindTools([ragTool]);
  const toolNode = new ToolNode([ragTool]);

  console.log("Using RAG tool to answer the question...\n");
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
  try {
    console.log("=== Simple RAG Tool Example ===\n");
    
    const question = "What is artificial intelligence?";
    const answer = await simpleRagTool(question);
    
    console.log("\n=== Final Answer ===");
    console.log(answer);
  } catch (error) {
    console.error("Error running RAG tool:", error);
  }
}


runExample();