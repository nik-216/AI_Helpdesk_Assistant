import nltk
import re
import sys
import json

# Ensure NLTK data is downloaded
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('tokenizers/punkt_tab/english')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')

def clean_and_chunk_text(text, chunk_size=500):
    try:
        if not text or not isinstance(text, str):
            return []
            
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        if not text:
            return []
            
        sentences = nltk.sent_tokenize(text)
        
        chunks = []
        current_chunk = ""
        current_word_count = 0
        
        for sentence in sentences:
            words = sentence.split()
            sentence_word_count = len(words)
            
            if current_word_count + sentence_word_count <= chunk_size:
                current_chunk += " " + sentence if current_chunk else sentence
                current_word_count += sentence_word_count
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
                current_word_count = sentence_word_count
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks
        
    except Exception as e:
        raise Exception(f"Chunking error: {str(e)}")

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print("Error: Missing required arguments", file=sys.stderr)
            sys.exit(1)
            
        input_text = sys.argv[1]
        try:
            text = json.loads(input_text)
        except json.JSONDecodeError:
            text = input_text
            
        chunk_size = int(sys.argv[2]) if len(sys.argv) > 2 else 500
        
        chunks = clean_and_chunk_text(text, chunk_size)
        print(json.dumps(chunks))
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)