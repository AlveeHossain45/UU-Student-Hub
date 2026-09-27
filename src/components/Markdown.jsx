import { Fragment } from "react";

/** Tiny, safe markdown renderer (no HTML injection) for AI responses. */
function inline(text, keyBase) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) parts.push(<strong key={k} className="font-semibold text-zinc-900 dark:text-white">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`"))
      parts.push(
        <code key={k} className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-700 dark:bg-ink-700 dark:text-brand-300">
          {tok.slice(1, -1)}
        </code>
      );
    else parts.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ content }) {
  const lines = content.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={blocks.length} className="my-3 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-[13px] leading-relaxed text-zinc-100 dark:border-ink-600">
          <code className="font-mono">{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, ""));
      blocks.push(
        <ul key={blocks.length} className="my-2 list-disc space-y-1 pl-5 marker:text-zinc-400">
          {items.map((t, j) => <li key={j}>{inline(t, `${blocks.length}-${j}`)}</li>)}
        </ul>
      );
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ""));
      blocks.push(
        <ol key={blocks.length} className="my-2 list-decimal space-y-1 pl-5 marker:text-zinc-400">
          {items.map((t, j) => <li key={j}>{inline(t, `${blocks.length}-${j}`)}</li>)}
        </ol>
      );
      continue;
    }
    if (line.startsWith("### ")) blocks.push(<h4 key={blocks.length} className="mb-1 mt-4 text-[15px] font-semibold text-zinc-900 dark:text-white">{inline(line.slice(4), blocks.length)}</h4>);
    else if (line.startsWith("## ")) blocks.push(<h3 key={blocks.length} className="mb-2 mt-1 text-base font-bold text-zinc-900 dark:text-white">{inline(line.slice(3), blocks.length)}</h3>);
    else if (line.startsWith("> "))
      blocks.push(
        <blockquote key={blocks.length} className="my-3 border-l-2 border-brand-400 pl-3 text-zinc-600 italic dark:text-zinc-300">
          {inline(line.slice(2), blocks.length)}
        </blockquote>
      );
    else if (line.trim() === "") blocks.push(<Fragment key={blocks.length} />);
    else blocks.push(<p key={blocks.length} className="my-1.5">{inline(line, blocks.length)}</p>);
    i++;
  }
  return <div className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300">{blocks}</div>;
}
