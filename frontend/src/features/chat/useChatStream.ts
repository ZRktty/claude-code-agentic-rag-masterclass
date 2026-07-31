import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL, getAuthHeader } from "@/lib/api";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function useChatStream(threadId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const headers = await getAuthHeader();
        const res = await fetch(`${API_BASE_URL}/api/threads/${threadId}/messages`, { headers });
        if (!res.ok) throw new Error("Failed to load messages");
        const data: ChatMessage[] = await res.json();
        if (!cancelled) setMessages(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!threadId) return;
      setError(null);

      const userMessage: ChatMessage = { id: `local-user-${Date.now()}`, role: "user", content };
      const assistantId = `local-assistant-${Date.now()}`;
      setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const headers = await getAuthHeader();
        const res = await fetch(`${API_BASE_URL}/api/threads/${threadId}/messages`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Failed to send message");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            let eventName = "message";
            let data = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event: ")) eventName = line.slice(7);
              else if (line.startsWith("data: ")) data += line.slice(6);
            }

            if (eventName === "delta") {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data } : m)),
              );
            } else if (eventName === "error") {
              setError(data || "Streaming error");
            }
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Network error — is the backend running?");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [threadId],
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { messages, loading, streaming, error, sendMessage };
}
