1. Offline Indexing Phase
    - Document Ingestion: Upload or provide the source documents.
    - Document Analysis & Chunking: Analyze the document structure and split it into semantic chunks, using custom
      overlap strategies to preserve context across chunk boundaries.
    - Embedding Generation: Generate vector embeddings for each chunk using a state-of-the-art embedding model.
    - Storage in Retrieval System: Store the embeddings (and associated chunk metadata/text) in an optimized vector
      database or retrieval index.
2. Real-Time Query Phase
    - Query Embedding: Convert the user’s query into an embedding using the same embedding model used during indexing.
    - Similarity Search: Perform a vector similarity search across all stored document embeddings to find the most
      relevant chunks.
    - Top-K Retrieval + Re-ranking (optional): Retrieve the top k most relevant chunks; optionally apply a re-ranking
      step for improved relevance.
    - Context Injection: Inject the retrieved chunks into the language model’s context window.
    - Answer Generation: Use the language model (e.g., Gemini) to generate a grounded, context-aware response based on
      the retrieved information.