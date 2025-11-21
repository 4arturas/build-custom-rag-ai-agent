// grader.js - Document relevance grading module for RAG agent

import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize model for grading
const graderModel = new ChatOllama({
  model: "llama3.2:3b",
  temperature: 0,
});

// Template for grading document relevance
const gradePrompt = PromptTemplate.fromTemplate(`
You are a grader assessing relevance of a retrieved document to a user question. 
If the document contains keywords related to the user question, grade it as relevant. 
It does not need to be a stringent test. The goal is to filter out erroneous retrievals. 

Give a binary score 'yes' or 'no' to indicate whether the document is relevant to the question.

Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.
Question: {question} 
Document: {document}
`);


// Function to grade a single document
async function gradeSingleDocument(question, document) {
  try {
    const chain = gradePrompt.pipe(graderModel).pipe(new StringOutputParser());
    const result = await chain.invoke({
      question: question,
      document: document.pageContent
    });
    
    // Parse the result to extract the score
    // The model should return JSON like {"score": "yes"} or {"score": "no"}
    const parsedResult = JSON.parse(result);
    return parsedResult.score === "yes";
  } catch (error) {
    console.error("Error grading document:", error);
    // In case of error, be conservative and mark as relevant
    return true;
  }
}

// Function to grade multiple documents
async function gradeDocuments(question, documents) {
  const gradedDocs = [];
  
  for (const doc of documents) {
    const isRelevant = await gradeSingleDocument(question, doc);
    if (isRelevant) {
      gradedDocs.push(doc);
    }
  }
  
  return gradedDocs;
}

export { gradeDocuments, gradeSingleDocument };