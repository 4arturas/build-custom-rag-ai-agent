import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";


const EMBEDDING_MODEL = "mxbai-embed-large";
const LLM_MODEL = "llama3.2:3b";
const DOCUMENT_URL = "https://en.wikipedia.org/wiki/Artificial_intelligence";

async function test()
{
    const loader = new CheerioWebBaseLoader(DOCUMENT_URL);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50
    })
    const splits = await splitter.splitDocuments(docs);

    const embeddings = new OllamaEmbeddings({
        model: EMBEDDING_MODEL
    })

    const vectorStore = await MemoryVectorStore.fromDocuments( splits, embeddings );
    const retriever =vectorStore.asRetriever();

    const question = "What is AI?";
    const relevantDocs = await retriever.invoke(question );
    const context = retriever.map( doc => doc.pageContent );
    const prompt = PromptTemplate.fromTemplate(
        "Answer based on context: {context} Question: {question}"
    );
    const model = new ChatOllama({
        model: LLM_MODEL,
        temperature: 0
    });
    const chain = prompt.pipe( model );
    const response = await chain.invoke( {
        context: context,
        question: question
    })

}

test();