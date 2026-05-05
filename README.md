# Sovra AI Frontend

**Sovra AI**  
**Sovereign Intelligence. Private by Design.**

This repository contains the customer-facing frontend website for Sovra AI.

Backend platform repository:  
https://github.com/tuanTaAnh/Sovra-Platform

---

## 1. Overview

Sovra AI Frontend is a React-based product demo website for a private / embedded AI assistant platform.

The website presents:

- What Sovra AI is
- Why private / embedded AI matters
- Automotive AI use cases
- Enterprise AI use cases
- A functional chatbot demo
- A clear value proposition for customers

The frontend is designed to look like a customer-presentable MVP rather than a developer-only dashboard.

---

## 2. Main Capabilities

The frontend currently supports:

- Landing page
- Product positioning
- Technology explanation
- Automotive use case sections
- Functional AI assistant demo
- Suggested automotive questions
- Conversation history
- Source display
- CTA buttons
- Architecture explanation
- Customer value sections

The demo highlights:

- Running locally
- No cloud AI API required
- Private by design
- Automotive knowledge enabled

---

## 3. Main Use Cases

### Vehicle Manual Assistant

Users can ask vehicle-related questions and receive answers from local vehicle manual documents.

Example questions:

```text
How do I enable lane assist?
How do I connect my phone to the vehicle?
```

### Troubleshooting Assistant

Users can ask about common vehicle warnings and receive safe next-step guidance.

Example questions:

```text
What should I do if tire pressure is low?
What should I do when the battery warning light appears?
```

### EV Charging Guidance

Users can ask about EV battery efficiency, daily charging, and fast charging.

Example questions:

```text
How can I improve EV battery efficiency?
Should I charge my EV to 100 percent every day?
```

### Private Enterprise Assistant

The same interface can demonstrate how Sovra AI can be adapted to internal company documents.

Example questions:

```text
How can Sovra AI be used for private document Q&A?
How does on-premise deployment reduce data leakage risk?
```

---

## 4. Frontend Architecture

```text
Browser
    ↓
Nginx Frontend Container
    ↓
/api/v1 proxy
    ↓
Sovra Backend API
    ↓
RAG Service
    ↓
Ollama + Milvus
```

In Docker deployment, the React app is built into static files and served through Nginx.

The Nginx container also proxies API requests:

```text
/api/v1/* → backend-api:8000/api/v1/*
```

This allows the browser to call relative API paths:

```text
/api/v1/chat/query
```

instead of hard-coding the backend host or port.

---

## 5. Related Repository

This frontend depends on the backend platform repository:

```text
https://github.com/tuanTaAnh/Sovra-Platform
```

The backend platform should be started before using the chatbot demo.

---

## 6. Project Structure

```text
Sovra-Frontend/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
│
├── Dockerfile
├── frontend.compose.yml
├── nginx.conf
├── package.json
├── vite.config.js
└── README.md
```

---

## 7. Docker Deployment

This section assumes Docker and Docker Compose are already installed.

The backend platform should already be running from:

```text
https://github.com/tuanTaAnh/Sovra-Platform
```

### 7.1 Clone Repository

```bash
git clone https://github.com/tuanTaAnh/Sovra-Frontend.git
cd Sovra-Frontend
```

### 7.2 Create Shared Docker Network

```bash
docker network create sovra-net
```

If the network already exists, this command can be ignored.

The frontend must use the same Docker network as the backend services.

### 7.3 Verify Compose File

Expected `frontend.compose.yml`:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: /api/v1
    image: sovra-frontend:local
    restart: unless-stopped
    ports:
      - "80:80"

networks:
  default:
    name: sovra-net
    external: true
```

The important value is:

```yaml
VITE_API_BASE_URL: /api/v1
```

This makes the production frontend call the Nginx proxy instead of calling a hard-coded backend URL.

### 7.4 Start Frontend

```bash
docker compose \
  -f frontend.compose.yml \
  up -d --build
```

### 7.5 Open Website

```text
http://<VM_EXTERNAL_IP>
```

Example:

```text
http://34.106.226.226
```

---

## 8. Test Frontend API Proxy

After the frontend container is running:

```bash
curl http://localhost/api/v1/health
```

Test chat through the frontend proxy:

```bash
curl -X POST http://localhost/api/v1/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What should I do if tire pressure is low?","top_k":3,"save_history":true}'
```

Expected result:

```text
HTTP 200 OK
answer
sources
conversation_id
retrieval_used=true
```

---

## 9. Local Development

For frontend development only:

```bash
npm install
npm run dev
```

Default local development URL:

```text
http://localhost:5173
```

For local development, configure the API base URL depending on where the backend is running.

Example:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

For Docker deployment, use:

```env
VITE_API_BASE_URL=/api/v1
```

If the API base URL changes, rebuild the frontend Docker image.

---

## 10. Stop Frontend

```bash
docker compose \
  -f frontend.compose.yml \
  down
```

---

## 11. Notes

This frontend is designed for a customer-presentable MVP demo.

It focuses on:

- Clear product positioning
- Practical automotive use cases
- Functional RAG chatbot demo
- Private / local AI messaging
- Simple deployment on a single VM

Potential improvements:

- Streaming assistant responses
- Better mobile layout
- Real Request Pilot form integration
- Authentication
- Admin panel for knowledge base management
- UI tests
- CI/CD deployment