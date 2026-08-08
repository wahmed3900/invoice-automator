<MessageBubble
  key={i}
  role={m.role}
  content={m.content}
  timestamp={m.timestamp}
  first={isFirstOfGroup(messages, i)}
  last={isLastOfGroup(messages, i)}
/>
