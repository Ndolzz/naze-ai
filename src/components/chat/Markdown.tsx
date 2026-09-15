"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Children, isValidElement, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Renders one AI message's markdown (spec §6: markdown, code block, syntax
 * highlighting, tables, lists, links, quotes, inline formatting). Kept as
 * its own component so the message shell in MessageBubble.tsx doesn't need
 * to know anything about parsing — it just passes a string in.
 */
export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        a: ({ href, children }) => {
          const safeHref = sanitizeHref(href);
          if (!safeHref) return <span>{children}</span>;
          return (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-text underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            >
              {children}
            </a>
          );
        },
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-border-strong pl-3 text-ink-muted last:mb-0">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto rounded-md border border-border last:mb-0">
            <table className="w-full border-collapse text-[13.5px]">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-border bg-surface-raised px-3 py-1.5 text-left font-medium text-ink">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-border px-3 py-1.5 align-top text-ink-muted last:border-b-0">
            {children}
          </td>
        ),
        img: ({ src, alt }) => (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URLs/dimensions from model output, can't use next/image without knowing the host ahead of time
          <img
            src={typeof src === "string" ? src : undefined}
            alt={alt ?? ""}
            loading="lazy"
            className="mb-3 max-w-full rounded-md border border-border last:mb-0"
          />
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = /language-/.test(className || "");
          if (!isBlock) {
            return (
              <code
                className="rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
                {...props}
              >
                {children}
              </code>
            );
          }
          const language = className?.replace("language-", "") ?? "";
          return (
            <CodeBlock language={language} className={className}>
              {children}
            </CodeBlock>
          );
        },
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({
  language,
  className,
  children,
}: {
  language: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const raw = Children.toArray(children)
    .map((child) => (isValidElement(child) ? childText(child) : String(child)))
    .join("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) —
      // fail quietly rather than throw in the middle of a chat render.
    }
  };

  return (
    <div className="mb-3 overflow-hidden rounded-md border border-border last:mb-0">
      <div className="flex items-center justify-between bg-surface-raised px-3 py-1.5">
        <span className="font-mono text-[12px] text-ink-faint">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          aria-label="Salin kode"
          className="flex items-center gap-1 text-[12px] text-ink-faint transition-colors hover:text-ink"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Disalin" : "Salin"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3">
        <code className={`${className ?? ""} font-mono text-[13px] leading-relaxed`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function childText(node: React.ReactElement): string {
  const props = node.props as { children?: React.ReactNode };
  if (typeof props.children === "string") return props.children;
  if (Array.isArray(props.children)) {
    return props.children
      .map((c) => (typeof c === "string" ? c : isValidElement(c) ? childText(c) : ""))
      .join("");
  }
  return "";
}

/**
 * Markdown link targets come straight from model output, which isn't
 * trusted content. `<a href="javascript:...">` (or `data:`, `vbscript:`)
 * would execute in the page if clicked — this only allows the protocols
 * a normal link is ever supposed to use. Anything else renders as plain
 * text instead of a clickable link, rather than silently dropping the
 * link (spec §33-adjacent: fail safe, don't fail invisibly).
 */
function sanitizeHref(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, "https://naze.invalid");
    const allowed = ["http:", "https:", "mailto:", "tel:"];
    return allowed.includes(url.protocol) ? href : null;
  } catch {
    return null;
  }
}
