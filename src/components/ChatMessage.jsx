function getFriendlySourceName(source = "") {
  const normalized = source.toLowerCase();

  if (normalized.includes("troubleshooting")) {
    return "Troubleshooting FAQ";
  }

  if (normalized.includes("vehicle_manual")) {
    return "Vehicle Manual";
  }

  if (normalized.includes("ev_charging")) {
    return "EV Charging Guide";
  }

  if (normalized.includes("enterprise_policy")) {
    return "Enterprise Policy";
  }

  const fileName = source.split("/").pop()?.split("#")[0] || "Local document";

  return fileName
    .replace(".md", "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUniqueSources(sources = []) {
  const seen = new Set();

  return sources.filter((item) => {
    const name = getFriendlySourceName(item.source);

    if (seen.has(name)) {
      return false;
    }

    seen.add(name);
    return true;
  });
}

export default function ChatMessage({ message, showTechnicalDetails = false }) {
  const isUser = message.role === "user";
  const sources = getUniqueSources(message.sources || []);

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>
      <div className="message-role">{isUser ? "You" : "Sovra AI"}</div>

      <div className="message-content">
        {message.content || message.answer || ""}
      </div>

      {!isUser && sources.length > 0 && (
        <div className="friendly-sources">
          <div className="sources-label">Sources used</div>

          <div className="source-chip-row">
            {sources.map((source, index) => (
              <details
                key={`${source.source}-${index}`}
                className="friendly-source-chip"
              >
                <summary>{getFriendlySourceName(source.source)}</summary>

                <div className="source-detail">
                  {source.preview && <p>{source.preview}</p>}

                  {showTechnicalDetails && (
                    <div className="technical-source">
                      <div>Raw source: {source.source || "unknown"}</div>
                      {typeof source.score === "number" && (
                        <div>Retrieval score: {source.score.toFixed(4)}</div>
                      )}
                      {source.doc_type && <div>Type: {source.doc_type}</div>}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>

          <div className="privacy-note">
            Processed locally · No cloud AI API used
          </div>
        </div>
      )}

      {!isUser && showTechnicalDetails && message.timings_ms && (
        <details className="timings">
          <summary>Technical timings</summary>
          <pre>{JSON.stringify(message.timings_ms, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}