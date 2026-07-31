import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
};
