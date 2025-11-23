// model_constants.js - Centralized model configuration for the RAG AI Agent project

export const MODEL_CONFIG = {
  // Embedding models
  EMBEDDING: {
    DEFAULT: "mxbai-embed-large",
    ALTERNATIVE: "nomic-embed-text"  // Alternative embedding model if needed
  },

  // LLM models for different purposes
  LLM: {
    DEFAULT: "llama3.2:3b",        // Default model for general tasks and tooling
    AGENT: "llama3.2:3b",          // Model for agent decision making
    GENERATION: "deepseek-r1:8b",  // Model for final response generation
    ALTERNATIVE: "mixtral:8x7b"    // Alternative model if needed
  },

  // Document processing
  DOCUMENT_RETRIEVAL: {
    URL: "https://en.wikipedia.org/wiki/Artificial_intelligence",
    CHUNK_SIZE: 500,
    CHUNK_OVERLAP: 50
  }
};

// Helper functions to get specific models
export const getEmbeddingModel = () => MODEL_CONFIG.EMBEDDING.DEFAULT;
export const getAgentModel = () => MODEL_CONFIG.LLM.AGENT;
export const getGenerationModel = () => MODEL_CONFIG.LLM.GENERATION;
export const getDefaultModel = () => MODEL_CONFIG.LLM.DEFAULT;
export const getChunkSize = () => MODEL_CONFIG.DOCUMENT_RETRIEVAL.CHUNK_SIZE;
export const getChunkOverlap = () => MODEL_CONFIG.DOCUMENT_RETRIEVAL.CHUNK_OVERLAP;

export default MODEL_CONFIG;