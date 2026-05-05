export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <div className="message-role">{isUser ? "You" : "Sovra AI"}</div>

      <div className="message-content">
        {message.content || message.answer || ""}
      </div>

      {!isUser && message.sources?.length > 0 && (
        <div className="sources">
          <div className="sources-title">Sources</div>
          {message.sources.map((source, index) => (
            <details key={`${source.source}-${index}`} className="source-card">
              <summary>
                <span>{source.source || "Unknown source"}</span>
                {typeof source.score === "number" && (
                  <span className="score">score {source.score.toFixed(3)}</span>
                )}
              </summary>
              {source.doc_type && (
                <div className="source-meta">Type: {source.doc_type}</div>
              )}
              {source.preview && (
                <div className="source-preview">{source.preview}</div>
              )}
            </details>
          ))}
        </div>
      )}

      {!isUser && message.timings_ms && (
        <details className="timings">
          <summary>Timings</summary>
          <pre>{JSON.stringify(message.timings_ms, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}