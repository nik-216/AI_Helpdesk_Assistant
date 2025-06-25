import sys
from dotenv import load_dotenv
import os
import json

import ast

from openai import OpenAI

load_dotenv()


# Get the arguments
model = sys.argv[1]
messages = ast.literal_eval(sys.argv[2])
similar_text = sys.argv[3]
specifications = sys.argv[4]
rejection_msg = sys.argv[5]
temp = float(sys.argv[6])

# Get all the api keys
OPENROUTER_API_KEY = os.getenv("OPENROUTER_KEY")

all_messages_for_api = []

if rejection_msg == '':
    rejection_msg = '''"I'm sorry, but I'm not able to assist with that request. Please feel free to ask something else, and I'll do my best to help!"'''

system_msg = '''You are a helpful assistant that provides accurate answers using ONLY the information in the knowledge base. Maintain a professional yet approachable tone.

Guidelines:
1. Carefully review the knowledge base content (marked with ```) for information relevant to the question (marked with *)
2. If relevant information exists, provide a clear, concise response using ONLY that content
3. If the knowledge base doesn't contain relevant information, respond: 
''' + rejection_msg + '''

Important rules:
- NEVER invent information or speculate beyond the provided knowledge base
- Never begin responses with "Based on the provided text" or similar phrases
- Always keep answers focused and directly responsive to the question
- Use markdown formatting when appropriate for clarity (lists, bold, etc.)
- If citing specific details, implicitly reference them without explicit attribution

Output:
- Generate it in a JSON format with the keys being answer and related_questions.
- For the answer, generate an answer for the user query
- For the related_questions, generate 3 related user queries
'''

# Function to format messages as required by OpenAI
def OPENAI_format_msgs(messages, all_messages_for_api):
    # Initialize with system message
    all_messages_for_api.clear()
    all_messages_for_api.append({'role': 'system', 'content': system_msg})

    # Add specifications if they exist
    if specifications: 
        all_messages_for_api.append({'role': 'system', 'content': specifications})
        
    # Add conversation history
    if messages:
        all_messages_for_api.extend(messages)
    
    # Format the last user message with knowledge base
    if all_messages_for_api:
        last_msg = all_messages_for_api[-1]
        if last_msg['role'] == 'user':
            last_msg['content'] = "Question:" + "*" + last_msg['content'] + "*" + "\n\nKnowledge Base:" + "```" + similar_text + "```"

# Function to get reply from OpenAI
def OPENAI_get_completion_from_messages(client, messages, model=model, temperature=temp):
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        response_format={"type": "json_object"} 
    )
    # Return just the content which should be JSON
    return response.choices[0].message.content

try :
    client = OpenAI(api_key=OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")
    OPENAI_format_msgs(messages, all_messages_for_api)
    
    if model == 'gpt-4o': 
        print(OPENAI_get_completion_from_messages(client, all_messages_for_api, "openai/chatgpt-4o-latest"))

    elif model == 'deepseek-chat':
        print(OPENAI_get_completion_from_messages(client, all_messages_for_api,"deepseek/deepseek-chat-v3-0324:free"))

    elif model == 'gemini-1.5-flash':
        print(OPENAI_get_completion_from_messages(client, all_messages_for_api, "google/gemini-flash-1.5"))
        
    elif model == 'gemini-2.0-flash':
        print(OPENAI_get_completion_from_messages(client, all_messages_for_api, "google/gemini-2.0-flash-001"))
        
except Exception as e:
    error_response = {
        "answer": rejection_msg,
        "related_questions": [],
        "error": {
            "type": type(e).__name__,
            "message": str(e),
            "args": e.args if hasattr(e, 'args') else []
        }
    }
    print(json.dumps(error_response))