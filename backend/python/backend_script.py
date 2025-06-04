import requests
from bs4 import BeautifulSoup

import psycopg2
import numpy as np

from sentence_transformers import SentenceTransformer

from dotenv import load_dotenv
import os

import mimetypes
import docx
import fitz

load_dotenv()

# Initialize embedding model
EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')

# PostgreSQL connection
conn = psycopg2.connect(
    dbname="ai_assistant",
    user="nikitha",
    password="123",
    host="localhost",
    port=5432
)
cur = conn.cursor()

# Ensure table exists with correct dimensions
cur.execute("""
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE IF NOT EXISTS web_embeddings (
        id SERIAL PRIMARY KEY,
        url TEXT,
        chunk TEXT,
        embedding vector(384)
    );
""")
conn.commit()

def extract_text_from_file(file_path):
    mime_type, _ = mimetypes.guess_type(file_path)

    if mime_type == "application/pdf":
        return extract_from_pdf(file_path)
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return extract_from_docx(file_path)
    elif mime_type and mime_type.startswith("text/") or file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        raise ValueError("Unsupported file type. Supported: PDF, DOCX, TXT")

def extract_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text

def extract_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def scrape_text(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    for tag in soup(["script", "style"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)

def chunk_text(text, max_words=100):
    words = text.split()
    chunks = [' '.join(words[i:i+max_words]) for i in range(0, len(words), max_words)]
    return chunks

def embed_text(chunks):
    embeddings = EMBEDDING_MODEL.encode(chunks)
    return list(zip(chunks, embeddings))

def insert_embeddings(url, chunk_embedding_pairs):
    for chunk, embedding in chunk_embedding_pairs:
        # Convert to PostgreSQL vector format string
        vec_str = "[" + ",".join(map(str, embedding.tolist())) + "]"
        cur.execute(
            "INSERT INTO web_embeddings (url, chunk, embedding) VALUES (%s, %s, %s::vector)",
            (url, chunk, vec_str)
        )
    conn.commit()

def search_similar(query, top_k=5):
    query_emb = EMBEDDING_MODEL.encode(query)
    vec_str = "[" + ",".join(map(str, query_emb.tolist())) + "]"
    
    cur.execute("""
        SELECT chunk, 1 - (embedding <=> %s::vector) AS cosine_similarity
        FROM web_embeddings
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (vec_str, vec_str, top_k))
    
    results = cur.fetchall()
    for chunk, score in results:
        print(f"\nScore: {score:.4f}\n{chunk[:200]}...\n")

def main():
    mode = input("Do you want to scrape a [u]rl or upload a [f]ile? (u/f): ").strip().lower()
    
    if mode == "u":
        url = input("Enter the URL to scrape: ").strip()
        if not url.startswith(("http://", "https://")):
            print("Please enter a valid URL.")
            return
        text = scrape_text(url)
        source = url
    
    elif mode == "f":
        file_path = input("Enter the full path to the file: ").strip()
        if not os.path.isfile(file_path):
            print("File not found.")
            return
        text = extract_text_from_file(file_path)
        source = file_path
    
    else:
        print("Invalid choice.")
        return

    if not text.strip():
        print("No text extracted.")
        return

    chunks = chunk_text(text)
    print(f"Split into {len(chunks)} chunks.")
    
    embeddings = embed_text(chunks)
    print(f"Generated {len(embeddings)} embeddings.")
    
    insert_embeddings(source, embeddings)
    print("Data inserted into PostgreSQL.")

    search_query = input("Enter a search query (or press Enter to skip): ").strip()
    if search_query:
        search_similar(search_query)

    cur.close()
    conn.close()
    print("Connection closed.")

if __name__ == "__main__":
    main()