import { Send, Square } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileAttach } from "./FileAttach";
import { useThreadFiles } from "./useThreadFiles";

type MessageInputProps = {
  threadId: string;
  disabled: boolean;
  onSend: (content: string) => void;
  onStop: () => void;
};

export function MessageInput({ threadId, disabled, onSend, onStop }: MessageInputProps) {
  const [value, setValue] = useState("");
  const { files, uploading, upload } = useThreadFiles(threadId);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <FileAttach files={files} uploading={uploading} disabled={disabled} onUpload={upload} />
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          disabled={disabled}
          className="min-h-10"
        />
        {disabled ? (
          <Button onClick={onStop} variant="secondary" aria-label="Stop generating">
            <Square className="fill-current" />
            Stop
          </Button>
        ) : (
          <Button onClick={submit} disabled={!value.trim()}>
            <Send />
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
