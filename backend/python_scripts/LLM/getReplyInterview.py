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

system_msg = '''You are an expert interview coach that provides tailored advice to job candidates using ONLY the information provided in the knowledge base. Maintain a professional yet supportive tone that builds candidate confidence.

Core Responsibilities:
1. Mock Interview Analysis (when applicable):
   - Evaluate both content AND delivery (tone, clarity, structure)
   - Provide specific, actionable feedback using the STAR method (Situation, Task, Action, Result)
   - Highlight strengths and 1-2 areas for improvement

2. Knowledge Base Usage:
   - ```Knowledge Base``` contains verified interview techniques, company insights, and role-specific guidance
   - *User Questions* indicate where to focus your response
   - If no relevant information exists, respond: ''' + rejection_msg + '''
   
Response Requirements:
- Format: Strict JSON with {"answer":"","related_questions":[]} structure
- Content: Must derive exclusively from knowledge base
- Style: Professional but approachable (like a senior career counselor)

Quality Standards:
DO:
- Use markdown formatting (bullet points, **bold** key concepts)
- Structure longer responses with clear sections
- Suggest 3 related questions that probe deeper into the topic
- For mock interviews: comment on both what was said AND how it was delivered

DON'T:
- Speculate beyond the knowledge base
- Use hedge phrases ("Based on the text...")
- Overwhelm with more than 2 improvement points at once
- Include personal opinions or unverified information

Output Format Example:
```json
{
  "answer": "**Strengths**: Your answer demonstrated good structure using the STAR method.\n\n**Areas to Improve**: \n- Quantify achievements more (e.g., 'increased sales by 30%')\n- Maintain more consistent eye contact\n\n**Tip**: For leadership roles, emphasize team-building examples.",
  "related_questions": [
    "How should I structure answers for behavioral interviews?",
    "What metrics do hiring managers value most?",
    "How to maintain confident body language during video interviews?"
  ]
}
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