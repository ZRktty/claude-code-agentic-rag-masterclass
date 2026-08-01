import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { ThreadSidebar } from "./ThreadSidebar";
import { useChatStream } from "./useChatStream";
import { useThreads } from "./useThreads";

export function ChatShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { id: threadId } = useParams();
  const {
    threads,
    loading: threadsLoading,
    error: threadsError,
    refresh: refreshThreads,
    createThread,
    deleteThread,
  } = useThreads();
  const {
    messages,
    loading: messagesLoading,
    streaming,
    error: streamError,
    sendMessage,
    stopStreaming,
  } = useChatStream(threadId);

  async function handleCreate() {
    const thread = await createThread();
    navigate(`/threads/${thread.id}`);
  }

  async function handleSend(content: string) {
    await sendMessage(content);
    refreshThreads();
  }

  async function handleDelete(id: string) {
    await deleteThread(id);
    if (id === threadId) navigate("/");
  }

  async function handleSignOut() {
    await signOut();
    navigate("/sign-in");
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold">Agentic RAG Masterclass</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ThreadSidebar
          threads={threads}
          activeThreadId={threadId}
          loading={threadsLoading}
          error={threadsError}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {threadId ? (
            <>
              <MessageList messages={messages} loading={messagesLoading} />
              {streamError && (
                <p className="border-t bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {streamError}
                </p>
              )}
              <MessageInput
                threadId={threadId!}
                disabled={streaming}
                onSend={handleSend}
                onStop={stopStreaming}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a thread or start a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
