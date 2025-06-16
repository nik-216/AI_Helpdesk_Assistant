import sys
import os
from dotenv import load_dotenv
import ast

from google import genai

load_dotenv()

chunks = ast.literal_eval(sys.argv[0])

try :

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    embedding_result = []

    for chunk in chunks :
        result = client.models.embed_content(
                model="gemini-embedding-exp-03-07",
                contents=chunk)
        embedding_result.append(result.embeddings)

    print(embedding_result)
    
except Exception as e:
    print(f"Error: {str(e)}")