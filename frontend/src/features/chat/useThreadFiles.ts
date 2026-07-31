import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type ThreadFile = {
  id: string;
  thread_id: string;
  openai_file_id: string;
  filename: string;
  created_at: string;
};

export function useThreadFiles(threadId: string | undefined) {
  const [files, setFiles] = useState<ThreadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!threadId) {
      setFiles([]);
      return;
    }
    try {
      const data = await api.get<ThreadFile[]>(`/api/threads/${threadId}/files`);
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    }
  }, [threadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File) => {
      if (!threadId) return;
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        await api.postForm(`/api/threads/${threadId}/files`, formData);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [threadId, refresh],
  );

  return { files, uploading, error, upload };
}
