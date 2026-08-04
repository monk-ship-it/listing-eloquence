import type { OpinlyContentNode, OpinlyContentMark } from "@/lib/opinly/types";
import { opinlyImageUrl } from "@/lib/opinly/shared";
import type { ReactNode } from "react";

/**
 * Renders the Opinly rich-text node tree returned as `post.content`.
 * Unknown node types fall back to rendering their children so no copy is lost.
 */
export function ContentRenderer({ node }: { node: OpinlyContentNode | null | undefined }) {
  if (!node) return null;
  return <>{renderNode(node, "root")}</>;
}

function renderChildren(node: OpinlyContentNode, keyPrefix: string): ReactNode {
  if (!node.content?.length) return null;
  return node.content.map((child, i) => renderNode(child, `${keyPrefix}-${i}`));
}

function attrString(node: OpinlyContentNode, key: string): string | undefined {
  const v = node.attrs?.[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function applyMarks(
  text: ReactNode,
  marks: OpinlyContentMark[] | undefined,
  key: string,
): ReactNode {
  if (!marks?.length) return text;
  return marks.reduce<ReactNode>((acc, mark, i) => {
    const k = `${key}-m${i}`;
    switch (mark.type) {
      case "bold":
      case "strong":
        return <strong key={k}>{acc}</strong>;
      case "italic":
      case "em":
        return <em key={k}>{acc}</em>;
      case "underline":
        return <u key={k}>{acc}</u>;
      case "strike":
        return <s key={k}>{acc}</s>;
      case "code":
        return (
          <code key={k} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">
            {acc}
          </code>
        );
      case "link": {
        const href = typeof mark.attrs?.["href"] === "string" ? mark.attrs["href"] : undefined;
        if (!href) return acc;
        const external = /^https?:\/\//i.test(href);
        return (
          <a
            key={k}
            href={href}
            className="font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, text);
}

function renderNode(node: OpinlyContentNode, key: string): ReactNode {
  switch (node.type) {
    case "text":
      return <span key={key}>{applyMarks(node.text ?? "", node.marks, key)}</span>;

    case "hardBreak":
      return <br key={key} />;

    case "paragraph":
      return (
        <p key={key} className="mb-5 leading-relaxed text-foreground/90">
          {renderChildren(node, key)}
        </p>
      );

    case "heading": {
      const rawLevel = node.attrs?.["level"];
      const level = typeof rawLevel === "number" ? Math.min(Math.max(rawLevel, 2), 4) : 2;
      const classes: Record<number, string> = {
        2: "mt-10 mb-4 font-serif text-2xl font-semibold tracking-tight sm:text-3xl",
        3: "mt-8 mb-3 font-serif text-xl font-semibold tracking-tight sm:text-2xl",
        4: "mt-6 mb-2 text-lg font-semibold",
      };
      const Tag = `h${level}` as "h2" | "h3" | "h4";
      return (
        <Tag key={key} className={classes[level]}>
          {renderChildren(node, key)}
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="mb-5 list-disc space-y-2 pl-6 text-foreground/90">
          {renderChildren(node, key)}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="mb-5 list-decimal space-y-2 pl-6 text-foreground/90">
          {renderChildren(node, key)}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="[&>p]:mb-0">
          {renderChildren(node, key)}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="mb-5 border-l-2 border-primary/60 pl-4 italic text-muted-foreground"
        >
          {renderChildren(node, key)}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre
          key={key}
          className="mb-5 overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 text-sm"
        >
          <code>{renderChildren(node, key)}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr key={key} className="my-8 border-border" />;

    case "image": {
      const src = opinlyImageUrl(attrString(node, "src") ?? attrString(node, "fileKey"));
      if (!src) return null;
      const alt = attrString(node, "alt") ?? "";
      const caption = attrString(node, "caption") ?? attrString(node, "title");
      return (
        <figure key={key} className="mb-6">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="w-full rounded-xl border border-border"
          />
          {caption ? (
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "table":
      return (
        <div key={key} className="mb-6 w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>{renderChildren(node, key)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return (
        <tr key={key} className="border-b border-border">
          {renderChildren(node, key)}
        </tr>
      );
    case "tableHeader":
      return (
        <th key={key} className="px-3 py-2 font-semibold">
          {renderChildren(node, key)}
        </th>
      );
    case "tableCell":
      return (
        <td key={key} className="px-3 py-2 align-top text-foreground/90">
          {renderChildren(node, key)}
        </td>
      );

    default:
      return <span key={key}>{renderChildren(node, key)}</span>;
  }
}
