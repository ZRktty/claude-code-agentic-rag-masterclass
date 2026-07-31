import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./useChatStream";

type MessageListProps = {
  messages: ChatMessage[];
  loading: boolean;
};

export function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Send a message to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "max-w-[70%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            {message.content || (message.role === "assistant" ? "..." : "")}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
