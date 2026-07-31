import { Loader2, Paperclip } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ThreadFile } from "./useThreadFiles";

type FileAttachProps = {
  files: ThreadFile[];
  uploading: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
};

export function FileAttach({ files, uploading, disabled, onUpload }: FileAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onUpload(file);
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        aria-label="Attach file"
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
      </Button>
      {files.map((f) => (
        <span
          key={f.id}
          className="max-w-40 truncate rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
          title={f.filename}
        >
          attached: {f.filename}
        </span>
      ))}
    </div>
  );
}
