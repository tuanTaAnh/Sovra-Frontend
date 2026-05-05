const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const DEFAULT_TOP_K = Number(import.meta.env.VITE_DEFAULT_TOP_K || 1);

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "string"
        ? body
        : body?.detail
          ? JSON.stringify(body.detail)
          : JSON.stringify(body);

    throw new Error(message || `Request failed: ${response.status}`);
  }

  return body;
}

export const api = {
  getHealthServices() {
    return request("/health/services");
  },

  getConversations() {
    return request("/chat/conversations");
  },

  createConversation(title) {
    return request("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ title })
    });
  },

  getConversation(conversationId) {
    return request(`/chat/conversations/${conversationId}`);
  },

  deleteConversation(conversationId) {
    return request(`/chat/conversations/${conversationId}`, {
      method: "DELETE"
    });
  },

  sendChatQuery({ query, topK, conversationId, saveHistory = true }) {
    return request("/chat/query", {
      method: "POST",
      body: JSON.stringify({
        query,
        top_k: topK,
        conversation_id: conversationId || null,
        save_history: saveHistory
      })
    });
  },

  getIngestStats() {
    return request("/ingest/stats");
  },

  runIngest({ reindex }) {
    return request("/ingest/run", {
      method: "POST",
      body: JSON.stringify({ reindex })
    });
  }
};