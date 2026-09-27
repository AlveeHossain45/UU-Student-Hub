import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Check, Copy, Trash2, Sparkles, BookOpenCheck, ListChecks, CalendarRange, Repeat, Square } from "lucide-react";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Markdown from "../components/Markdown";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useLocalStorage from "../hooks/useLocalStorage";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { sendMessage, isMockMode } from "../services/aiService";
import { cn } from "../utils/cn";
import { getFirstName, uid } from "../utils/helpers";

const SUGGESTIONS = [
  { icon: BookOpenCheck, text: "Explain DBMS normalization simply." },
  { icon: ListChecks, text: "Give me 10 MCQs about Data Structures." },
  { icon: CalendarRange, text: "Create a study plan for my exam." },
  { icon: Repeat, text: "Explain recursion with an example." },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  useDocumentTitle("AI Assistant");
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useLocalStorage("uu_chat", []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const scrollRef = useRef(null);
  const textRef = useRef(null);
  const streamRef = useRef(null);

  const busy = thinking || !!streamingId;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => () => clearInterval(streamRef.current), []);

  const autoresize = () => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const stream = (id, full) => {
    let i = 0;
    setStreamingId(id);
    clearInterval(streamRef.current);
    streamRef.current = setInterval(() => {
      i = Math.min(full.length, i + Math.max(3, Math.round(full.length / 120)));
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, content: full.slice(0, i) } : x)));
      if (i >= full.length) {
        clearInterval(streamRef.current);
        setStreamingId(null);
      }
    }, 16);
  };

  const stop = () => {
    clearInterval(streamRef.current);
    setStreamingId(null);
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const userMsg = { id: uid(), role: "user", content, at: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setTimeout(autoresize, 0);
    setThinking(true);
    try {
      const reply = await sendMessage(history);
      const id = uid();
      setMessages((m) => [...m, { id, role: "assistant", content: "", at: Date.now() }]);
      setThinking(false);
      stream(id, reply);
    } catch (err) {
      setThinking(false);
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: `⚠️ Sorry, something went wrong: ${err.message}`, error: true, at: Date.now() }]);
    }
  };

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopied(m.id);
      toast.success("Response copied to clipboard.");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden border-zinc-200/80 bg-white sm:h-[calc(100dvh-6rem)] sm:rounded-2xl sm:border lg:h-[calc(100dvh-7rem)] dark:border-ink-700 dark:bg-ink-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5 dark:border-ink-700">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Sparkles size={18} />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-white">UU Study Assistant</h1>
            <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {isMockMode() ? "Demo mode · mock responses" : "Online"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={Trash2} disabled={!messages.length} onClick={() => setConfirmClear(true)}>
          <span className="hidden sm:inline">Clear chat</span>
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" aria-live="polite">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
              <Bot size={26} />
            </span>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">Hi {getFirstName(user?.name)}, what are we studying today?</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">Ask me to explain concepts, quiz you with MCQs, or build a study plan for your exams.</p>
            <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-ink-600 dark:bg-ink-850 dark:text-zinc-300 dark:hover:border-ink-500"
                >
                  <s.icon size={18} className="mt-0.5 shrink-0 text-zinc-400 transition group-hover:text-brand-500" />
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex animate-fade-in justify-end gap-3">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-[14px] text-white sm:max-w-[75%] dark:bg-brand-600">
                    {m.content}
                  </div>
                  <Avatar name={user?.name} src={user?.avatar} size="sm" className="hidden sm:inline-flex" />
                </div>
              ) : (
                <div key={m.id} className="group flex animate-fade-in gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-ink-700 dark:text-zinc-200">
                    <Sparkles size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={cn("min-w-0", m.error && "text-red-600 dark:text-red-400")}>
                      <Markdown content={m.content} />
                      {streamingId === m.id && <span className="ml-0.5 inline-block h-4 w-1.5 animate-blink bg-zinc-400 align-middle" />}
                    </div>
                    {streamingId !== m.id && m.content && (
                      <div className="mt-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                        <button
                          onClick={() => copy(m)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-ink-700 dark:hover:text-zinc-200"
                          aria-label="Copy response"
                        >
                          {copied === m.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          {copied === m.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
            {thinking && (
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-ink-700 dark:text-zinc-200">
                  <Sparkles size={15} />
                </span>
                <TypingDots />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-zinc-100 p-3 sm:p-4 dark:border-ink-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-ink-600 dark:bg-ink-850"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message the study assistant
          </label>
          <textarea
            id="chat-input"
            ref={textRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoresize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything about your courses…"
            className="max-h-[180px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
          />
          {streamingId ? (
            <Button type="button" size="icon" variant="secondary" onClick={stop} aria-label="Stop generating">
              <Square size={14} fill="currentColor" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim() || busy} aria-label="Send message">
              <ArrowUp size={18} />
            </Button>
          )}
        </form>
        <p className="mt-2 text-center text-[11px] text-zinc-400">AI responses may be inaccurate. Verify important information with your course materials.</p>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear conversation?"
        description="All messages in this chat will be permanently deleted."
        confirmText="Clear chat"
        onConfirm={() => {
          stop();
          setMessages([]);
          toast.success("Chat cleared.");
        }}
      />
    </div>
  );
}
