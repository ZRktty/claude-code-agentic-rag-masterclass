import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { threadsRouter } from "./routes/threads";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Authorization", "Content-Type"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.use("/api/*", authMiddleware);

// Throwaway debug route for validating auth middleware (Module 1, sub-plan 2).
app.get("/api/_whoami", (c) => {
  const user = c.get("user");
  return c.json({ id: user.id, email: user.email });
});

app.route("/api/threads", threadsRouter);

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
};
