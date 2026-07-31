import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { getUserClient } from "../lib/supabase";
import { openai, OPENAI_MODEL } from "../lib/openai";
import type { AppEnv } from "../types";

function truncateTitle(content: string) {
  const trimmed = content.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

export const threadsRouter = new Hono<AppEnv>();

const createThreadSchema = z.object({
  title: z.string().trim().min(1).optional(),
});

const updateThreadSchema = z.object({
  title: z.string().trim().min(1),
});

threadsRouter.post("/", async (c) => {
  const parsed = createThreadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const user = c.get("user");
  const supabase = getUserClient(c.get("accessToken"));

  const conversation = await openai.conversations.create({});

  const { data, error } = await supabase
    .from("threads")
    .insert({
      user_id: user.id,
      title: parsed.data.title ?? "New chat",
      openai_conversation_id: conversation.id,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data, 201);
});

threadsRouter.get("/", async (c) => {
  const supabase = getUserClient(c.get("accessToken"));
  const { data, error } = await supabase
    .from("threads")
    .select()
    .order("updated_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

threadsRouter.get("/:id", async (c) => {
  const supabase = getUserClient(c.get("accessToken"));
  const { data, error } = await supabase
    .from("threads")
    .select()
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(data);
});

threadsRouter.patch("/:id", async (c) => {
  const parsed = updateThreadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const supabase = getUserClient(c.get("accessToken"));
  const { data, error } = await supabase
    .from("threads")
    .update({ title: parsed.data.title })
    .eq("id", c.req.param("id"))
    .select()
    .maybeSingle();

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(data);
});

threadsRouter.delete("/:id", async (c) => {
  const supabase = getUserClient(c.get("accessToken"));
  const { data, error } = await supabase
    .from("threads")
    .delete()
    .eq("id", c.req.param("id"))
    .select()
    .maybeSingle();

  if (error) {
    return c.json({ error: error.message }, 500);
  }
  if (!data) {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    await openai.conversations.delete(data.openai_conversation_id);
  } catch {
    // OpenAI-side cleanup failure shouldn't block the local delete.
  }

  return c.body(null, 204);
});

threadsRouter.post("/:id/files", async (c) => {
  const supabase = getUserClient(c.get("accessToken"));
  const user = c.get("user");
  const threadId = c.req.param("id");

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select()
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) {
    return c.json({ error: threadError.message }, 500);
  }
  if (!thread) {
    return c.json({ error: "Not found" }, 404);
  }

  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) {
    return c.json({ error: "Missing file" }, 400);
  }

  let vectorStoreId = thread.openai_vector_store_id as string | null;
  if (!vectorStoreId) {
    const vectorStore = await openai.vectorStores.create({ name: `thread-${threadId}` });
    vectorStoreId = vectorStore.id;
    const { error: updateError } = await supabase
      .from("threads")
      .update({ openai_vector_store_id: vectorStoreId })
      .eq("id", threadId);
    if (updateError) {
      return c.json({ error: updateError.message }, 500);
    }
  }

  const vectorStoreFile = await openai.vectorStores.files.uploadAndPoll(vectorStoreId, file);
  if (vectorStoreFile.status !== "completed") {
    return c.json({ error: `File processing ${vectorStoreFile.status}` }, 502);
  }

  const { data: threadFile, error: insertError } = await supabase
    .from("thread_files")
    .insert({
      thread_id: threadId,
      user_id: user.id,
      openai_file_id: vectorStoreFile.id,
      filename: file.name,
    })
    .select()
    .single();

  if (insertError) {
    return c.json({ error: insertError.message }, 500);
  }

  return c.json(
    { fileId: threadFile.openai_file_id, vectorStoreId, filename: threadFile.filename },
    201,
  );
});

threadsRouter.get("/:id/files", async (c) => {
  const supabase = getUserClient(c.get("accessToken"));
  const threadId = c.req.param("id");

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select()
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) {
    return c.json({ error: threadError.message }, 500);
  }
  if (!thread) {
    return c.json({ error: "Not found" }, 404);
  }

  const { data, error } = await supabase
    .from("thread_files")
    .select()
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1),
});

threadsRouter.post("/:id/messages", async (c) => {
  const parsed = sendMessageSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const supabase = getUserClient(c.get("accessToken"));
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select()
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (threadError) {
    return c.json({ error: threadError.message }, 500);
  }
  if (!thread) {
    return c.json({ error: "Not found" }, 404);
  }

  const responseStream = await openai.responses.create({
    model: OPENAI_MODEL,
    input: parsed.data.content,
    conversation: thread.openai_conversation_id,
    stream: true,
    ...(thread.openai_vector_store_id
      ? {
          tools: [
            { type: "file_search" as const, vector_store_ids: [thread.openai_vector_store_id] },
          ],
        }
      : {}),
  });

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of responseStream) {
        if (event.type === "response.output_text.delta") {
          await stream.writeSSE({ event: "delta", data: event.delta });
        } else if (event.type === "response.completed") {
          const nextTitle =
            thread.title === "New chat" ? truncateTitle(parsed.data.content) : thread.title;
          await supabase.from("threads").update({ title: nextTitle }).eq("id", thread.id);
          await stream.writeSSE({ event: "done", data: "ok" });
        } else if (event.type === "error") {
          await stream.writeSSE({ event: "error", data: event.message });
        }
      }
    } catch (err) {
      await stream.writeSSE({
        event: "error",
        data: err instanceof Error ? err.message : "Streaming failed",
      });
    }
  });
});

threadsRouter.get("/:id/messages", async (c) => {
  const supabase = getUserClient(c.get("accessToken"));
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select()
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (threadError) {
    return c.json({ error: threadError.message }, 500);
  }
  if (!thread) {
    return c.json({ error: "Not found" }, 404);
  }

  const items = await openai.conversations.items.list(thread.openai_conversation_id, {
    order: "asc",
  });

  const messages = items.data
    .filter((item): item is Extract<typeof item, { type: "message" }> => item.type === "message")
    .map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content
        .map((part) => ("text" in part ? part.text : ""))
        .join(""),
    }));

  return c.json(messages);
});
