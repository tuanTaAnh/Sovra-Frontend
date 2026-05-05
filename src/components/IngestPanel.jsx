export default function IngestPanel({
  ingestStats,
  ingestLoading,
  onRefreshStats,
  onRunIngest
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Knowledge Base</div>
          <div className="panel-subtitle">Milvus / document index</div>
        </div>

        <button className="ghost-button" onClick={onRefreshStats}>
          Refresh
        </button>
      </div>

      <div className="stats-box">
        {ingestStats ? (
          <pre>{JSON.stringify(ingestStats, null, 2)}</pre>
        ) : (
          <div className="empty-small">No stats loaded.</div>
        )}
      </div>

      <button
        className="danger-button full-width"
        onClick={() => onRunIngest(true)}
        disabled={ingestLoading}
      >
        {ingestLoading ? "Reindexing..." : "Run reindex"}
      </button>
    </section>
  );
}