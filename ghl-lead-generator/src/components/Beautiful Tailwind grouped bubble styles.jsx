import React from "react";

export default function MessageBubble({ role, content, timestamp, first, last }) {
  const isUser = role === "user";

  return (
    <div className="flex items-end gap-2">
      
      {/* Assistant avatar (only on first bubble of group) */}
      {!isUser && first && (
        <img
          src="/ai.png"
          alt="AI"
          className="w-8 h-8 rounded-full shadow-md"
        />
      )}

      <div
        className={`
          max-w-[75%] px-4 py-3 rounded-2xl shadow-sm whitespace-pre-wrap animate-fadeInUp
          ${isUser 
            ? "bg-indigo-600 text-white ml-auto" 
            : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
          }

          ${first ? "mt-3" : "mt-1"}
          ${last ? "mb-3" : "mb-1"}

          ${!first && isUser ? "rounded-tr-md" : ""}
          ${!first && !isUser ? "rounded-tl-md" : ""}

          ${!last && isUser ? "rounded-br-md" : ""}
          ${!last && !isUser ? "rounded-bl-md" : ""}
        `}
      >
        <p>{content}</p>

        {last && (
          <span className="text-xs opacity-70 block mt-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        )}
      </div>

      {/* User avatar (only on first bubble of group) */}
      {isUser && first && (
        <img
          src="/me.png"
          alt="You"
          className="w-8 h-8 rounded-full shadow-md"
        />
      )}
    </div>
  );
}
