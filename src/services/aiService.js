/**
 * AI Study Assistant service.
 *
 * Resolution order:
 *   1. `VITE_AI_API_URL` — an explicitly configured endpoint (external backend).
 *   2. `${VITE_API_URL}/chat` — our own backend, when API mode is active. It
 *      holds the provider key server-side; keys never reach the browser.
 *   3. Built-in mock responder so the assistant always works standalone.
 *
 * Any endpoint must accept POST { messages: [{ role, content }] } and return
 * { reply: string }.
 */
import { mockReply } from "./mockAi";
import { apiChat, configuredApiUrl, isApiMode } from "./api";

const OVERRIDDEN_URL = import.meta.env.VITE_AI_API_URL;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const endpoint = () => OVERRIDDEN_URL || (isApiMode() && configuredApiUrl ? `${configuredApiUrl}/chat` : null);

/** True when no chat endpoint is configured (purely local demo responses). */
export const isMockMode = () => !endpoint();

export async function sendMessage(messages, { signal } = {}) {
  const url = endpoint();
  const slim = messages.map(({ role, content }) => ({ role, content }));

  if (url) {
    try {
      const reply = isApiMode() && !OVERRIDDEN_URL
        ? await apiChat(slim, { signal })
        : await callEndpoint(url, slim, signal);
      if (reply) return reply;
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      // A dead local backend should not break the assistant — degrade to mock.
      if (err?.code !== "NETWORK") throw err;
      console.warn("[ai]", err.message);
    }
  }

  await wait(700 + Math.random() * 700);
  const last = [...messages].reverse().find((m) => m.role === "user");
  return mockReply(last?.content || "");
}

async function callEndpoint(url, messages, signal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok) throw Object.assign(new Error(`AI service error (${res.status})`), { code: `HTTP_${res.status}` });
  const data = await res.json();
  return data.reply ?? "";
}
