import sys
from dotenv import load_dotenv
import os

import ast

from openai import OpenAI
from google import genai

load_dotenv()


# Get the arguments
model = sys.argv[1]
messages = ast.literal_eval(sys.argv[2])
similar_text = sys.argv[3]
specifications = sys.argv[4]
temp = float(sys.argv[5])

# Get all the api keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

all_messages_for_api = []

# system_msg = '''You are a helpful chatbot that answers questions using ONLY the information provided in the knowledge base. Use a polite and informational tone.

# When answering:
# 1. First analyze if the knowledge base contains relevant information
# 2. If relevant information exists, synthesize a concise answer using ONLY that information
# 3. If no relevant information exists, respond: "I'm sorry, but I'm not able to assist with that request. Please feel free to ask something else, and I'll do my best to help!"

# Knowledge base content will be marked with triple backticks (```) and the Question to be answered will be marked with astrik (*).

# NEVER make up information or speculate beyond what's in the knowledge base.'''

system_msg = '''You are a helpful assistant that provides accurate answers using ONLY the information in the knowledge base. Maintain a professional yet approachable tone.

Guidelines:
1. Carefully review the knowledge base content (marked with ```) for information relevant to the question (marked with *)
2. If relevant information exists, provide a clear, concise response using ONLY that content
3. If the knowledge base doesn't contain relevant information, respond: 
   "I'm sorry, but I'm not able to assist with that request. Please feel free to ask something else, and I'll do my best to help!"

Important rules:
- NEVER invent information or speculate beyond the provided knowledge base
- Never begin responses with "Based on the provided text" or similar phrases
- Always keep answers focused and directly responsive to the question
- Use markdown formatting when appropriate for clarity (lists, bold, etc.)
- If citing specific details, implicitly reference them without explicit attribution'''

# Function to format messages as required by OpenAI
def OPNEAI_format_msgs(messages, all_messages_for_api):
    # Add all the nesessary prompts to the messages
    all_messages_for_api = [{'role': 'system', 'content': system_msg}]

    if specifications: 
        all_messages_for_api.extend([{'role': 'system', 'content': specifications}])
        
    if messages:
        all_messages_for_api.extend(messages)
    all_messages_for_api[-1]['content'] = "Question:" + "*" + all_messages_for_api[-1]['content'] + "*" + "Knowledge Base:" + "```" + similar_text + "```"

# Function to format messages according to input required by gemini
def GOOGLE_format_msgs(messages, all_messages_for_api):
    gemini_initial_user_content = system_msg

    if specifications:
        gemini_initial_user_content += "\n\n" + specifications

    all_messages_for_api.append({
        'role': 'user',
        'parts': [{'text': gemini_initial_user_content + "\n\n" + messages[0]['content']}]
    })

    for i, msg in enumerate(messages[1:]):
        role = 'user' if msg['role'] == 'user' else 'model'
        all_messages_for_api.append({
            'role': role,
            'parts': [{'text': msg['content']}]
        })

    if all_messages_for_api[-1]['role'] == 'user':
        all_messages_for_api[-1]['parts'][0]['text'] += "\n\n" + "Question:" + "*" + messages[-1]['content'] + "*" + "Knowledge Base:" + "```" + similar_text + "```"
    else:
        all_messages_for_api.append({
            'role': 'user',
            'parts': [{'text': "Question:" + "*" + messages[-1]['content'] + "*" + "Knowledge Base:" + "```" + similar_text + "```"}]
        })


# Function to get reply from OpenAI
def OPENAI_get_completion_from_messages(client, messages, model=model, temperature=temp):
    response = client.chat.completions.create(
        model = model,
        messages = messages,
        temperature = temperature
    )
    return response.choices[0].message

# Function to get reply from Google
def GOOGLE_get_completion_from_messages(client, messages, model=model, temperature=temp):
    response = client.models.generate_content(
        model = model,
        contents = messages
    )
    return response.text

try :
    if model == 'gpt-3.5-turbo': 
        OPNEAI_format_msgs(messages, all_messages_for_api)
        client = OpenAI(api_key=OPENAI_API_KEY)
        print(OPENAI_get_completion_from_messages(client, all_messages_for_api))

    elif model == 'deepseek-chat':
        OPNEAI_format_msgs(messages, all_messages_for_api)
        client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        print(OPENAI_get_completion_from_messages(client, all_messages_for_api))

    elif model == 'gemini-1.5-flash':
        GOOGLE_format_msgs(messages, all_messages_for_api)
        client = genai.Client(api_key=GEMINI_API_KEY)
        print(GOOGLE_get_completion_from_messages(client, all_messages_for_api))
        
except Exception as e:
    print(f"Error: {str(e)}")