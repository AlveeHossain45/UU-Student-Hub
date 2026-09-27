import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { all, nowIso, run } from "../db/index.js";
import { asyncHandler, serviceUnavailable } from "../lib/errors.js";
import { parse } from "../lib/validate.js";
import { rowId } from "../lib/tokens.js";
import { mockReply } from "../../src/services/mockAi.js";

const messagesSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1, "Message cannot be empty.").max(8000, "Message is too long."),
    })
  )
  .min(1, "Send at least one message.")
  .max(40, "Conversation history is capped at 40 messages.");

/** Server-side LLM call — the API key never reaches the browser. */
async function callProvider(messages) {
  const { provider, apiKey, baseUrl, model, systemPrompt, maxTokens } = config.ai;

  if (provider !== "openai") return null;
  if (!apiKey) throw serviceUnavailable("No AI provider is configured on the server.");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.6,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[ai] provider responded ${response.status}`, detail.slice(0, 400));
    throw serviceUnavailable("The AI provider is temporarily unavailable. Please try again shortly.");
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content ?? "";
}

export const chatRouter = Router();

/**
 * POST /api/chat  { messages }  ->  { reply }
 *
 * This is the one endpoint that does NOT use the { data } envelope, because
 * the existing frontend aiService.js contract (documented in the README)
 * expects a top-level `reply` field.
 */
chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const messages = parse(messagesSchema, Array.isArray(req.body?.messages) ? req.body.messages : []);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");

    let reply;
    try {
      reply = await callProvider(messages);
    } catch (err) {
      if (err?.status === 503) throw err;
      console.error("[ai] provider call failed:", err?.message || err);
      throw serviceUnavailable("The AI assistant could not be reached. Please try again shortly.");
    }

    if (!reply) reply = mockReply(lastUser?.content || "");

    const ts = nowIso();
    messages.slice(-4).forEach((m) => {
      run(
        "INSERT INTO chatMessages (id, userId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)",
        rowId("cm"),
        req.user.id,
        m.role,
        m.content,
        ts
      );
    });
    run(
      "INSERT INTO chatMessages (id, userId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)",
      rowId("cm"),
      req.user.id,
      "assistant",
      reply,
      ts
    );

    // Trim history so one student's transcript cannot grow without bound.
    run(
      `DELETE FROM chatMessages WHERE userId = ? AND id NOT IN (
         SELECT id FROM chatMessages WHERE userId = ? ORDER BY createdAt DESC, rowid DESC LIMIT 200
       )`,
      req.user.id,
      req.user.id
    );

    res.json({ reply });
  })
);

chatRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json({
      data: all("SELECT id, role, content, createdAt FROM chatMessages WHERE userId = ? ORDER BY createdAt ASC, rowid ASC", req.user.id),
    });
  })
);

chatRouter.delete(
  "/",
  asyncHandler(async (req, res) => {
    run("DELETE FROM chatMessages WHERE userId = ?", req.user.id);
    res.json({ data: { ok: true } });
  })
);
