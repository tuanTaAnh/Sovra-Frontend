export default function Sidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation
}) {
  return (
    <aside className="sidebar">
      <button className="primary-button full-width" onClick={onNewChat}>
        New chat
      </button>

      <div className="sidebar-title">Conversations</div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="empty-small">No conversations yet.</div>
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
                onClick={() => onSelectConversation(item.id)}
                title={item.title}
              >
                {item.title}
              </button>

              <button
                className="delete-button"
                onClick={() => onDeleteConversation(item.id)}
                title="Delete conversation"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}