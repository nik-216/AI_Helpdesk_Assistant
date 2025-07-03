import { ChromaClient } from 'chromadb';

const chroma_client = new ChromaClient();

// chroma_client.deleteCollection({ name: 'knowledge_embeddings' });

export { chroma_client };