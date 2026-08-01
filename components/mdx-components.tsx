import type { Components } from "react-markdown";
import { type ReactNode } from "react";
import CodeBlock from "./CodeBlock";

function toText(children: ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number")
    return String(children);
  if (Array.isArray(children)) return children.map(toText).join("");
  if (typeof children === "object" && "props" in (children as object)) {
    return toText(
      (children as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

/**
 * Component overrides for rendered write-up markdown. Everything else falls
 * through to plain HTML styled by `.wu-prose`. We override `pre` (not `code`)
 * so fenced blocks become the charcoal CodeBlock while inline code stays a chip.
 */
export const markdownComponents: Components = {
  pre({ children }) {
    // react-markdown renders block code as <pre><code class="language-x">…</code></pre>
    const code = Array.isArray(children) ? children[0] : children;
    const className =
      (code as { props?: { className?: string } })?.props?.className ?? "";
    const lang = /language-([\w-]+)/.exec(className)?.[1];
    const text = toText(
      (code as { props?: { children?: ReactNode } })?.props?.children,
    ).replace(/\n$/, "");
    return <CodeBlock text={text} lang={lang} />;
  },
  a({ href = "", children, ...rest }) {
    const external = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  img: (props) => <img loading="lazy" {...props} />,
};
