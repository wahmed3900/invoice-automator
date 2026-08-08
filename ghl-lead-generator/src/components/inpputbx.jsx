import React, { useState } from "react";

export default function InputBox({ onSend }) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="
            flex-1 p-3 rounded-xl resize-none h-14
            bg-gray-100 dark:bg-gray-700
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500
          "
        />

        <button
          onClick={handleSend}
          className="
            px-4 py-2 rounded-xl
            bg-indigo-600 text-white
            hover:bg-indigo-700
            transition
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}
