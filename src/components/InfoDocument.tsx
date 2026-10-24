import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Clock3 } from "lucide-react";

type InfoDocumentProps = {
  source: "about.md" | "privacy.md" | "terms.md" | "cookies.md";
  label: string;
  summary: string;
  updated?: string;
};

type DocumentBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isNumberedHeading(line: string) {
  return /^\d+\.\s+[A-Z][^.!?]*$/.test(line.trim());
}

function parseDocument(raw: string): DocumentBlock[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const blocks: DocumentBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      index += 1;
      continue;
    }
    if (line.startsWith("## ") || isNumberedHeading(line)) {
      const text = line.startsWith("## ") ? line.slice(3).trim() : line;
      blocks.push({ type: "h2", text, id: slugify(text) });
      index += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      index += 1;
      continue;
    }
    if (/^[*-]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[*-]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[*-]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next.startsWith("#") || /^[*-]\s+/.test(next) || /^\d+\.\s+/.test(next) || isNumberedHeading(next)) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ type: "p", text: paragraph.join(" ") });
  }

  return blocks;
}

function inlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>;
    return part;
  });
}

export function InfoDocument({ source, label, summary, updated }: InfoDocumentProps) {
  const raw = readFileSync(path.join(process.cwd(), "src", "content", source), "utf8");
  const blocks = parseDocument(raw);
  const title = blocks.find((block) => block.type === "h1");
  const sections = blocks.filter((block): block is Extract<DocumentBlock, { type: "h2" }> => block.type === "h2");

  return (
    <article className="info-page">
      <div className="info-page-back"><Link href="/"><ArrowLeft /> Back to marketplace</Link></div>
      <header className="info-page-hero">
        <span>{label}</span>
        <h1>{title && "text" in title ? title.text : label}</h1>
        <p>{summary}</p>
        {updated && <small><Clock3 /> Updated {updated}</small>}
      </header>

      <div className="info-page-layout">
        <aside className="info-page-toc">
          <strong>On this page</strong>
          <nav aria-label={`${label} sections`}>
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}><span>{section.text}</span><ChevronRight /></a>
            ))}
          </nav>
        </aside>

        <div className="info-page-copy">
          <details className="info-page-mobile-toc">
            <summary>On this page <ChevronRight /></summary>
            <nav>
              {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.text}</a>)}
            </nav>
          </details>

          {blocks.slice(title ? blocks.indexOf(title) + 1 : 0).map((block, index) => {
            if (block.type === "h1") return null;
            if (block.type === "h2") return <h2 id={block.id} key={`${block.id}-${index}`}>{inlineText(block.text)}</h2>;
            if (block.type === "h3") return <h3 key={index}>{inlineText(block.text)}</h3>;
            if (block.type === "ul" || block.type === "ol") {
              const List = block.type;
              return <List key={index}>{block.items.map((item) => <li key={item}>{inlineText(item)}</li>)}</List>;
            }
            return <p key={index}>{inlineText(block.text)}</p>;
          })}
        </div>
      </div>
    </article>
  );
}
