import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Thread } from "./useThreads";

type ThreadSidebarProps = {
  threads: Thread[];
  activeThreadId: string | undefined;
  loading: boolean;
  error: string | null;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export function ThreadSidebar({
  threads,
  activeThreadId,
  loading,
  error,
  onCreate,
  onDelete,
}: ThreadSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r">
      <div className="border-b p-3">
        <Button className="w-full" onClick={onCreate}>
          <Plus />
          New thread
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="p-2 text-sm text-muted-foreground">Loading threads...</p>}
        {error && <p className="p-2 text-sm text-destructive">{error}</p>}
        {!loading && !error && threads.length === 0 && (
          <p className="p-2 text-sm text-muted-foreground">No threads yet. Start one above.</p>
        )}
        <ul className="flex flex-col gap-1">
          {threads.map((thread) => (
            <li key={thread.id} className="group/thread-item flex items-center gap-1">
              <Link
                to={`/threads/${thread.id}`}
                className={cn(
                  "flex-1 truncate rounded-lg px-2.5 py-1.5 text-sm hover:bg-muted",
                  thread.id === activeThreadId && "bg-muted font-medium",
                )}
              >
                {thread.title}
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover/thread-item:opacity-100"
                onClick={() => onDelete(thread.id)}
                aria-label="Delete thread"
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
