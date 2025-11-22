import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
});

const vectorStore = new MemoryVectorStore(embeddings);

const EMBEDDING_MODEL = "mxbai-embed-large";
const LLM_MODEL = "llama3.2:3b";
const DOCUMENT_URL = "https://en.wikipedia.org/wiki/Artificial_intelligence";

async function test()
{
    const loader = new CheerioWebBaseLoader( DOCUMENT_URL );
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        overlap: 50
    });
    const splits = await splitter.splitDocuments(docs);

    const embeddings = new OllamaEmbeddings({
        model: EMBEDDING_MODEL
    });

    const vectorStore = await HNSWLib.fromDocuments(splits, embeddings);
    const retriever = vectorStore.asRetriever();
    console.log( retriever );
}

test();