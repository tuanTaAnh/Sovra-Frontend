import { useEffect, useMemo, useRef, useState } from "react";
import { api, DEFAULT_TOP_K } from "./api/client";
import ChatMessage from "./components/ChatMessage";

const TRUST_BADGES = [
  "Running locally",
  "No cloud API required",
  "Private by design",
  "Automotive knowledge enabled"
];

const SUGGESTED_QUESTIONS = [
  "How do I enable lane assist?",
  "What should I do if tire pressure is low?",
  "How can I improve EV battery efficiency?",
  "How do I connect my phone to the vehicle?"
];

const DEMO_SCENARIOS = [
  {
    title: "Vehicle Manual Assistant",
    description: "Ask vehicle-related questions and receive clear answers.",
    question: "How do I enable lane assist?"
  },
  {
    title: "Troubleshooting Assistant",
    description: "Understand common warnings and next steps.",
    question: "What should I do if tire pressure is low?"
  },
  {
    title: "Private Enterprise Assistant",
    description: "Adapt the same system to internal company documents.",
    question: "What is the remote work policy?"
  }
];

function makeId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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

  const [showPilotModal, setShowPilotModal] = useState(false);
  const [pilotSubmitted, setPilotSubmitted] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const demoRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const canSend = useMemo(() => {
    return query.trim().length > 0 && !chatLoading;
  }, [query, chatLoading]);

  const isReady = Boolean(health?.rag_service?.ok);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

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
    } catch {
      setHealth(null);
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
    } catch {
      setConversations([]);
    }
  }

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 450);
  }

  function handleSuggestedQuestion(questionText) {
    setQuery(questionText);
    scrollToDemo();
  }

  async function handleSelectConversation(conversationId) {
    try {
      setError("");
      const data = await api.getConversation(conversationId);
      setSelectedConversationId(data.id);
      setMessages(data.messages || []);
      scrollToDemo();
    } catch (err) {
      setError(`Could not load this conversation. ${err.message}`);
    }
  }

  async function handleNewChat() {
    setSelectedConversationId(null);
    setMessages([]);
    setQuery("");
    setError("");
    scrollToDemo();
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
      setError(`Could not delete this conversation. ${err.message}`);
    }
  }

  async function handleRunIngest(reindex) {
    try {
      setError("");
      setIngestLoading(true);

      const result = await api.runIngest({ reindex });
      setIngestStats(result);

      await loadIngestStats();
      await loadHealth();
    } catch (err) {
      setError(`Knowledge base update failed. ${err.message}`);
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
      setError(`Sovra AI could not complete the request. ${err.message}`);

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content:
            "I could not reach the local assistant service. Please check the backend connection or try again.",
          sources: [],
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handlePilotSubmit(event) {
    event.preventDefault();
    setPilotSubmitted(true);
  }

  return (
    <div className="product-shell">
      <nav className="top-nav">
        <button className="brand-mark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="brand-icon">S</span>
          <span>
            <strong>Sovra AI</strong>
            <small>Sovereign Intelligence</small>
          </span>
        </button>

        <div className="nav-links">
          <a href="#technology">Technology</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#architecture">Architecture</a>
          <button className="nav-link-button" onClick={scrollToDemo}>
            Demo
          </button>
        </div>

        <div className="nav-actions">
          <button className="secondary-button" onClick={scrollToDemo}>
            Try Demo
          </button>
          <button className="primary-button" onClick={() => setShowPilotModal(true)}>
            Request Pilot
          </button>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">Private embedded AI platform</div>

            <h1>Private Embedded AI for Vehicles and Enterprises</h1>

            <p className="hero-subtitle">
              Sovra AI enables fast, secure, local intelligence for automotive
              and enterprise environments without relying on constant cloud
              connectivity.
            </p>

            <div className="trust-badges">
              {TRUST_BADGES.map((badge) => (
                <span key={badge} className="trust-badge">
                  {badge}
                </span>
              ))}
            </div>

            <div className="hero-actions">
              <button className="primary-button large" onClick={scrollToDemo}>
                Try Demo
              </button>
              <button className="secondary-button large" onClick={() => setShowPilotModal(true)}>
                Request Pilot
              </button>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-header">
              <span className={`live-dot ${isReady ? "ok" : "idle"}`} />
              <span>{isReady ? "Local assistant ready" : "Local assistant starting"}</span>
            </div>

            <div className="mini-chat">
              <div className="mini-message user">
                What should I do if tire pressure is low?
              </div>
              <div className="mini-message assistant">
                Reduce speed, avoid hard braking, park safely, check all tires,
                and inflate them to the recommended pressure.
              </div>
            </div>

            <div className="hero-card-footer">
              Processed locally · Automotive knowledge enabled
            </div>
          </div>
        </section>

        <section id="technology" className="content-section">
          <div className="section-heading">
            <span className="eyebrow">Technology</span>
            <h2>Built for private, low-latency intelligence</h2>
            <p>
              A practical local AI stack for automotive assistants, enterprise
              document Q&A, and secure on-premise deployments.
            </p>
          </div>

          <div className="feature-grid">
            <FeatureCard
              title="Local / on-device AI"
              description="Run intelligence near the user, vehicle, or enterprise environment instead of depending on constant cloud access."
            />
            <FeatureCard
              title="Private inference"
              description="Questions and documents stay inside the controlled deployment boundary."
            />
            <FeatureCard
              title="RAG knowledge base"
              description="Retrieve answers from local automotive manuals, troubleshooting guides, and enterprise documents."
            />
            <FeatureCard
              title="Deployment-ready backend"
              description="FastAPI services, local vector database, Docker-compatible infrastructure, and modular architecture."
            />
          </div>
        </section>

        <section id="use-cases" className="content-section">
          <div className="section-heading">
            <span className="eyebrow">Automotive use cases</span>
            <h2>Designed for vehicle and enterprise assistance</h2>
          </div>

          <div className="scenario-grid">
            {DEMO_SCENARIOS.map((scenario) => (
              <button
                key={scenario.title}
                className="scenario-card"
                onClick={() => handleSuggestedQuestion(scenario.question)}
              >
                <span>{scenario.title}</span>
                <p>{scenario.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section ref={demoRef} id="demo" className="demo-section">
          <div className="section-heading compact">
            <span className="eyebrow">Functional AI demo</span>
            <h2>Live Automotive Assistant</h2>
            <p>
              Ask about vehicle manuals, warnings, EV charging, or driver
              assistance. The assistant uses the local Sovra knowledge base.
            </p>
          </div>

          <div className="demo-layout">
            <aside className="demo-sidebar">
              <button className="primary-button full-width" onClick={handleNewChat}>
                New chat
              </button>

              <div className="sidebar-block">
                <h3>Suggested questions</h3>
                <div className="suggested-list">
                  {SUGGESTED_QUESTIONS.map((item) => (
                    <button key={item} onClick={() => handleSuggestedQuestion(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sidebar-block">
                <h3>Recent chats</h3>
                <div className="conversation-list">
                  {conversations.length === 0 ? (
                    <p className="muted-small">No conversations yet.</p>
                  ) : (
                    conversations.map((item) => (
                      <div
                        key={item.id}
                        className={`conversation-item ${
                          selectedConversationId === item.id ? "active" : ""
                        }`}
                      >
                        <button
                          className="conversation-title"
                          onClick={() => handleSelectConversation(item.id)}
                          title={item.title}
                        >
                          {item.title}
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDeleteConversation(item.id)}
                          title="Delete conversation"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <section className="chat-product-card">
              <div className="chat-header">
                <div>
                  <h3>Sovra Automotive Assistant</h3>
                  <p>Private local Q&A over automotive knowledge.</p>
                </div>

                <div className="local-status">
                  <span className={`live-dot ${isReady ? "ok" : "idle"}`} />
                  {isReady ? "Ready" : "Checking"}
                </div>
              </div>

              {error && (
                <div className="error-banner">
                  <span>{error}</span>
                  <button onClick={() => setError("")}>×</button>
                </div>
              )}

              <div className="messages">
                {messages.length === 0 ? (
                  <div className="welcome-card">
                    <h3>Try the private automotive assistant</h3>
                    <p>
                      Start with a sample question or ask anything about vehicle
                      manuals, troubleshooting, EV charging, or driver support.
                    </p>

                    <div className="welcome-actions">
                      {SUGGESTED_QUESTIONS.slice(0, 2).map((item) => (
                        <button key={item} onClick={() => handleSuggestedQuestion(item)}>
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      showTechnicalDetails={showTechnicalDetails}
                    />
                  ))
                )}

                {chatLoading && (
                  <div className="message assistant">
                    <div className="message-role">Sovra AI</div>
                    <div className="thinking-row">
                      <span className="thinking-dot" />
                      Thinking with local knowledge...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form className="chat-form" onSubmit={handleSend}>
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ask about lane assist, tire pressure, EV charging, phone pairing..."
                  rows={2}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend(event);
                    }
                  }}
                />

                <div className="send-column">
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

                  <button className="primary-button" type="submit" disabled={!canSend}>
                    {chatLoading ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </section>

            <aside className="value-panel">
              <div className="panel-card">
                <h3>Why this demo matters</h3>
                <ul className="clean-list">
                  <li>Answers are grounded in local documents.</li>
                  <li>No external cloud AI API is required.</li>
                  <li>Designed for private and embedded deployments.</li>
                  <li>Built for automotive and enterprise workflows.</li>
                </ul>
              </div>

              <div className="panel-card">
                <h3>Knowledge enabled</h3>
                <div className="source-pill-list">
                  <span>Vehicle Manual</span>
                  <span>Troubleshooting FAQ</span>
                  <span>EV Charging Guide</span>
                  <span>Enterprise Policy</span>
                </div>
              </div>

              <DeveloperTools
                health={health}
                ingestStats={ingestStats}
                ingestLoading={ingestLoading}
                showTechnicalDetails={showTechnicalDetails}
                setShowTechnicalDetails={setShowTechnicalDetails}
                onRefreshHealth={loadHealth}
                onRefreshStats={loadIngestStats}
                onRunIngest={handleRunIngest}
              />
            </aside>
          </div>
        </section>

        <section id="architecture" className="content-section">
          <div className="section-heading">
            <span className="eyebrow">Architecture</span>
            <h2>Simple local AI deployment flow</h2>
          </div>

          <div className="architecture-flow">
            <FlowStep title="User Interface" detail="React web demo" />
            <FlowStep title="API Layer" detail="FastAPI backend" />
            <FlowStep title="Local AI Engine" detail="Ollama / small LLM" />
            <FlowStep title="Knowledge Base" detail="Local RAG + Milvus" />
            <FlowStep title="Secure Deployment" detail="On-prem / edge ready" />
          </div>
        </section>

        <section className="content-section customer-section">
          <div className="section-heading">
            <span className="eyebrow">Customer value</span>
            <h2>Built for OEM and enterprise needs</h2>
          </div>

          <div className="customer-grid">
            <div className="customer-card">
              <h3>For Automotive OEMs</h3>
              <ul className="clean-list">
                <li>Better in-car user experience</li>
                <li>Reduced cloud dependency</li>
                <li>Faster response time</li>
                <li>More privacy for drivers</li>
                <li>Differentiated vehicle intelligence</li>
              </ul>
            </div>

            <div className="customer-card">
              <h3>For Enterprises</h3>
              <ul className="clean-list">
                <li>Secure internal AI assistant</li>
                <li>Private document Q&A</li>
                <li>On-premise deployment</li>
                <li>Workflow automation</li>
                <li>Lower risk of data leakage</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <h2>Ready to pilot private embedded AI?</h2>
          <p>
            Test Sovra AI with your automotive manuals, enterprise documents, or
            private deployment environment.
          </p>
          <button className="primary-button large" onClick={() => setShowPilotModal(true)}>
            Request Pilot
          </button>
        </section>
      </main>

      {showPilotModal && (
        <PilotModal
          submitted={pilotSubmitted}
          onClose={() => {
            setShowPilotModal(false);
            setPilotSubmitted(false);
          }}
          onSubmit={handlePilotSubmit}
        />
      )}
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function FlowStep({ title, detail }) {
  return (
    <div className="flow-step">
      <div className="flow-dot" />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}

function DeveloperTools({
  health,
  ingestStats,
  ingestLoading,
  showTechnicalDetails,
  setShowTechnicalDetails,
  onRefreshHealth,
  onRefreshStats,
  onRunIngest
}) {
  return (
    <details className="developer-tools">
      <summary>Developer details</summary>

      <div className="developer-inner">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showTechnicalDetails}
            onChange={(event) => setShowTechnicalDetails(event.target.checked)}
          />
          Show retrieval scores and timings
        </label>

        <div className="dev-actions">
          <button className="secondary-button small" onClick={onRefreshHealth}>
            Refresh status
          </button>
          <button className="secondary-button small" onClick={onRefreshStats}>
            Refresh KB
          </button>
        </div>

        <div className="service-mini-list">
          <ServiceMini name="Backend" ok={health?.backend?.ok} />
          <ServiceMini name="RAG" ok={health?.rag_service?.ok} />
          <ServiceMini name="Ingest" ok={health?.ingest_service?.ok} />
        </div>

        <div className="stats-mini">
          <pre>
            {ingestStats
              ? JSON.stringify(ingestStats, null, 2)
              : "Knowledge base stats unavailable."}
          </pre>
        </div>

        <button
          className="danger-button full-width"
          onClick={() => onRunIngest(true)}
          disabled={ingestLoading}
        >
          {ingestLoading ? "Reindexing..." : "Run reindex"}
        </button>
      </div>
    </details>
  );
}

function ServiceMini({ name, ok }) {
  return (
    <div className="service-mini">
      <span>{name}</span>
      <strong className={ok ? "ok" : "bad"}>{ok ? "OK" : "Check"}</strong>
    </div>
  );
}

function PilotModal({ submitted, onClose, onSubmit }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="pilot-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {submitted ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Pilot request received</h2>
            <p>
              Thank you. This demo form is ready for a real CRM or email
              integration later.
            </p>
            <button className="primary-button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <span className="eyebrow">Request Pilot</span>
            <h2>Start a private AI pilot</h2>
            <p>
              Tell us about your automotive or enterprise use case. For this
              MVP, the form shows the intended customer flow without sending
              external data.
            </p>

            <form className="pilot-form" onSubmit={onSubmit}>
              <input required placeholder="Name" />
              <input required placeholder="Work email" type="email" />
              <input required placeholder="Company" />
              <select defaultValue="Automotive OEM">
                <option>Automotive OEM</option>
                <option>Enterprise documents</option>
                <option>On-premise AI assistant</option>
                <option>Embedded / edge deployment</option>
              </select>
              <textarea rows={4} placeholder="What would you like to pilot?" />

              <button className="primary-button full-width" type="submit">
                Submit pilot request
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}