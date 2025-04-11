# Reddit Insight Proxy

A FastAPI-based proxy server that provides OpenAI-compatible API endpoints for the Reddit Insight Chrome extension.

## Features

- OpenAI-compatible API endpoints (`/v1/chat/completions`, `/v1/models`)
- Forwards requests to various LLM providers
- Streaming support for real-time responses
- Simple authentication for proxy users

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the development server:
   ```
   uvicorn app.main:app --reload
   ```

3. Access the API documentation at `http://localhost:8000/docs`

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Proxy Configuration
PROXY_API_KEYS=key1,key2,key3
ALLOWED_ORIGINS=chrome-extension://your-extension-id,http://localhost:5173

# Provider API Keys
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

## Deployment

The proxy can be deployed using various methods:

1. Docker:
   ```
   docker build -t plify-proxy .
   docker run -p 8000:8000 plify-proxy
   ```

2. Cloud services (AWS, Google Cloud, etc.)

3. Self-hosted VPS 