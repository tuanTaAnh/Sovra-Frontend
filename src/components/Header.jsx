export default function Header({ health, onRefreshHealth }) {
  const ragOk = health?.rag_service?.ok;
  const ingestOk = health?.ingest_service?.ok;

  return (
    <header className="app-header">
      <div>
        <div className="brand">Sovra AI</div>
        <div className="subtitle">Local RAG assistant dashboard</div>
      </div>

      <div className="status-row">
        <StatusDot label="RAG" ok={ragOk} />
        <StatusDot label="Ingest" ok={ingestOk} />
        <button className="ghost-button" onClick={onRefreshHealth}>
          Refresh
        </button>
      </div>
    </header>
  );
}

function StatusDot({ label, ok }) {
  return (
    <span className="status-dot-wrap">
      <span className={`status-dot ${ok ? "ok" : "bad"}`} />
      {label}
    </span>
  );
}