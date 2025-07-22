# AI Helpdesk Assistant

The AI Helpdesk Assistant is a modular chatbot system designed to support real-time query handling using domain-specific knowledge bases. This system enables administrators to train custom chatbots using uploaded documents or scraped web content. It supports voice and text interactions through an embeddable widget and is ideal for use cases like interview preparation, customer support, or internal knowledge assistance.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Use Case: Interview Preparation Chatbot](#use-case-interview-preparation-chatbot)
- [Current Progress](#current-progress)
- [Setup Instructions](#setup-instructions)

---

## Features

- Document and URL ingestion for chatbot training
- Vector database integration (ChromaDB) for embedding storage
- Admin panel for chatbot creation, configuration, and monitoring
- Support for DeepSeek, Gemini and OpenAI LLMs
- Real-time voice and text interactions via chat widget
- Out-of-scope query handling with customizable rejection messages
- Authentication using JWT and API keys
- Redis-based caching for recent LLM requests to optimize latency and reduce redundant calls

---

## Tech Stack

**Frontend:**

- React (Admin Dashboard)
- HTML/CSS/JavaScript (Embeddable Widget)
- Web Speech API (Voice Input/Output)

**Backend:**

- Node.js
- Express
- Python (Chunking, scraping)

**Database:**

- PostgreSQL (metadata and chat storage)
- ChromaDB (vector embeddings)
- Redis (cache for recent LLM queries)

**Authentication:**

- JWT (Admin)
- API Key (Widget)

**LLM Providers:**

- DeepSeek API
- Gemini API
- OpenAI API

---

## Architecture Overview

1. Admin logs in and creates a chatbot with a unique name.
2. Admin uploads documents (PDF, DOCX, TXT) or URLs as knowledge sources.
3. Text is extracted, chunked, embedded using Transformers, and stored in ChromaDB.
4. Admin customizes bot settings like:
   - LLM model (Gemini, DeepSeek)
   - Temperature
   - Persistent history
   - Rejection message
5. Admin embeds the chatbot on any website using a generated API key.
6. User interacts with the bot via the widget.
7. Backend retrieves top 10 similar embeddings and sends them with the query to the LLM.
8. If the query is out-of-scope, a rejection message is returned.
9. All chat interactions are stored and accessible to the respective admin.
10. Redis checks if a similar LLM query has been processed recently:
   - If cached, the cached response is returned.
   - If not cached, the LLM is queried and the response is stored in Redis.

---

## Use Case: Interview Preparation Chatbot

This implementation enables users to conduct mock interviews by interacting with a domain-trained chatbot. Users can:

- Answer practice questions and get feedback on tone and clarity
- Explore commonly asked questions for specific job roles
- Ask follow-up queries to expand their understanding

The system ensures queries are answered only if the answer exists in the knowledge base, preserving domain accuracy and relevance.

---

## Current Progress

- React-based admin panel for creating, viewing, and deleting chatbots
- Document and URL upload support with real-time embedding and storage
- Chatbot-specific settings management (LLM, temperature, rejection message)
- API key-based chatbot embedding
- Widget frontend with voice/text input, voice output, and chat history
- Backend endpoints for all CRUD operations and chat handling
- Middleware for JWT authentication and API key validation
- ChromaDB and PostgreSQL integration for vector and metadata storage
- Redis cache integrated for improved response times and LLM efficiency

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/nik-216/AI_Helpdesk_Assistant.git
cd AI_Helpdesk_Assistant
```
2. Install dependencies (Node.js, Python)
```bash
npm install
pip install python-dotenv openai requests beautifulsoup4

```
3. Start PostgreSQL, Redis and Chroma servers
```bash
brew services start postgresql
chroma run --path ./chroma_storage
redis-server
```
4. Run backend and frontend servers
```bash
npm start
```
