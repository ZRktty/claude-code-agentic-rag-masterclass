import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Thread = {
  id: string;
  title: string;
  openai_conversation_id: string;
  created_at: string;
  updated_at: string;
};

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Thread[]>("/api/threads");
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load threads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createThread = useCallback(async () => {
    const thread = await api.post<Thread>("/api/threads", {});
    setThreads((prev) => [thread, ...prev]);
    return thread;
  }, []);

  const renameThread = useCallback(async (id: string, title: string) => {
    const updated = await api.patch<Thread>(`/api/threads/${id}`, { title });
    setThreads((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteThread = useCallback(async (id: string) => {
    await api.delete(`/api/threads/${id}`);
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { threads, loading, error, refresh, createThread, renameThread, deleteThread };
}
