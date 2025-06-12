import sys
import psycopg2
from dotenv import load_dotenv
import os
from sentence_transformers import SentenceTransformer

load_dotenv()

# PostgreSQL connection
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cur = conn.cursor()

query = sys.argv[1]
top_k = sys.argv[2]

EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')

try:
    query_emb = EMBEDDING_MODEL.encode(query)
    vec_str = "[" + ",".join(map(str, query_emb.tolist())) + "]"
    
    cur.execute("""
        SELECT chunk, 1 - (embedding <=> %s::vector) AS cosine_similarity
        FROM knowledge_embeddings
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (vec_str, vec_str, top_k))

    results = cur.fetchall()
    for chunk, score in results:
        print(f"\nScore: {score:.4f}-{chunk}")

except Exception as e:
    print(f"Error: {str(e)}")