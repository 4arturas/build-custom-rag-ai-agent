import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";


const MODEL_EMBEDDING = "mxbai-embed-large";
const MODEL_LLM = "llama3.2:3b";
const DOCUMENT_URL = "https://en.wikipedia.org/wiki/Artificial_intelligence";

async function test()
{
    const loader = new CheerioWebBaseLoader(DOCUMENT_URL);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({chunkSize:500,chunkOverlap:50});
    const splits = await splitter.splitDocuments( docs );
    const embeddings = new OllamaEmbeddings({model:MODEL_EMBEDDING});
    const vectorStorage = await MemoryVectorStore.fromDocuments( splits, embeddings );
    const retriever = vectorStorage.asRetriever();
    const question = "What is AI?";
    const relevantDocs = await retriever.invoke( question );
    const context = relevantDocs.map( doc => doc.pageContent ).join("\n");
    const model = new ChatOllama({model:MODEL_LLM,temperature:0});
    const prompt = PromptTemplate.fromTemplate("Answer based on context: {context} Question: {question}");
    const chain = await prompt.pipe( model );
    const response = await chain.invoke({context,question});
    console.log( response.content );
}

test();