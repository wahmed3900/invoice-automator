import React, { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import TypingIndicator from "./TypingIndicator";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  // --- GROUPING LOGIC ---
  function isFirstOfGroup(messages, index) {
    if (index === 0) return true;
    return messages[index].role !== messages[index - 1].role;
  }

  function isLastOfGroup(messages, index) {
    if (index === messages.length - 1) return true;
    return messages[index].role !== messages[index + 1].role;
  }

  // --- SEND MESSAGE ---
  async function sendMessage(text) {
    const userMsg = {
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // IMPORTANT FIX: use the *updated* messages list
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg] })
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "No response";

    setTyping(false);

    const assistantMsg = {
      role: "assistant",
      content: reply,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMsg]);
  }

  // --- AUTO SCROLL ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">

        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role}
            content={m.content}
            timestamp={m.timestamp}
            first={isFirstOfGroup(messages, i)}
            last={isLastOfGroup(messages, i)}
          />
        ))}

        {typing && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      <InputBox onSend={sendMessage} />
    </div>
  );
}
