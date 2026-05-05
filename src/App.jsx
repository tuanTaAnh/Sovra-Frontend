import { useEffect, useMemo, useRef, useState } from "react";
import { api, DEFAULT_TOP_K } from "./api/client";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";
import IngestPanel from "./components/IngestPanel";
import ServiceStatus from "./components/ServiceStatus";

export default function App() {
  const [health, setHealth] = useState(null);
  const [ingestStats, setIngestStats] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(DEFAULT_TOP_K);

  const [chatLoading, setChatLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  const canSend = useMemo(() => {
    return query.trim().length > 0 && !chatLoading;
  }, [query, chatLoading]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  function makeId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  async function loadInitialData() {
    await Promise.allSettled([
      loadHealth(),
      loadConversations(),
      loadIngestStats()
    ]);
  }

  async function loadHealth() {
    try {
      const data = await api.getHealthServices();
      setHealth(data);
    } catch (err) {
      setError(`Health check failed: ${err.message}`);
    }
  }

  async function loadIngestStats() {
    try {
      const data = await api.getIngestStats();
      setIngestStats(data);
    } catch {
      setIngestStats(null);
    }
  }

  async function loadConversations() {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      setError(`Load conversations failed: ${err.message}`);
    }
  }

  async function handleSelectConversation(conversationId) {
    try {
      setError("");
      const data = await api.getConversation(conversationId);
      setSelectedConversationId(data.id);
      setMessages(data.messages || []);
    } catch (err) {
      setError(`Load conversation failed: ${err.message}`);
    }
  }

  async function handleNewChat() {
    setSelectedConversationId(null);
    setMessages([]);
    setQuery("");
    setError("");
  }

  async function handleDeleteConversation(conversationId) {
    const ok = window.confirm("Delete this conversation?");
    if (!ok) return;

    try {
      await api.deleteConversation(conversationId);

      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  }

  async function handleRunIngest(reindex) {
    try {
      setError("");
      setIngestLoading(true);

      const result = await api.runIngest({ reindex });
      setIngestStats(result);

      await loadIngestStats();
    } catch (err) {
      setError(`Ingest failed: ${err.message}`);
    } finally {
      setIngestLoading(false);
    }
  }

  async function handleSend(event) {
    event?.preventDefault();

    const cleanQuery = query.trim();
    if (!cleanQuery || chatLoading) return;

    const userMessage = {
      id: makeId(),
      role: "user",
      content: cleanQuery,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setError("");
    setChatLoading(true);

    try {
      const response = await api.sendChatQuery({
        query: cleanQuery,
        topK,
        conversationId: selectedConversationId,
        saveHistory: true
      });

      const assistantMessage = {
        id: makeId(),
        conversation_id: response.conversation_id,
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
        timings_ms: response.timings_ms || null,
        created_at: new Date().toISOString()
      };

      setSelectedConversationId(response.conversation_id);
      setMessages((prev) => [...prev, assistantMessage]);

      await loadConversations();
    } catch (err) {
      setError(`Query failed: ${err.message}`);

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content:
            "Sorry, I could not get an answer from the backend. Please check service health.",
          sources: [],
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="main">
        <Header health={health} onRefreshHealth={loadHealth} />

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="content-grid">
          <section className="chat-card">
            <div className="chat-header">
              <div>
                <div className="chat-title">Chat</div>
                <div className="chat-subtitle">
                  Ask questions over your local Sovra knowledge base.
                </div>
              </div>

              <label className="topk-control">
                top_k
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(event) => setTopK(Number(event.target.value))}
                />
              </label>
            </div>

            <div className="messages">
              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="welcome-title">Ask Sovra AI</div>
                  <div className="welcome-text">
                    Try: “What should I do if tire pressure is low?”
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))
              )}

              {chatLoading && (
                <div className="message assistant">
                  <div className="message-role">Sovra AI</div>
                  <div className="typing">Thinking...</div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form className="chat-form" onSubmit={handleSend}>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask a question..."
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
              />

              <button className="primary-button" type="submit" disabled={!canSend}>
                {chatLoading ? "Sending..." : "Send"}
              </button>
            </form>
          </section>

          <aside className="right-panel">
            <ServiceStatus health={health} />

            <IngestPanel
              ingestStats={ingestStats}
              ingestLoading={ingestLoading}
              onRefreshStats={loadIngestStats}
              onRunIngest={handleRunIngest}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}