import React, { useMemo, useState } from "react";
import { absoluteAppUrl } from "../utils/paths.js";

export function ToolSharePanel({ tool }) {
  const [copyState, setCopyState] = useState("");
  const toolUrl = absoluteAppUrl(`/tools/${tool.slug}`);
  const postText = useMemo(
    () =>
      [
        `Found a tiny useful tool: ${tool.title}.`,
        tool.description,
        `Try it here: ${toolUrl}`
      ].join("\n"),
    [tool.description, tool.title, toolUrl]
  );

  async function copy(value, label) {
    await navigator.clipboard.writeText(value);
    setCopyState(label);
    window.setTimeout(() => setCopyState(""), 1800);
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copy(postText, "Copied");
      return;
    }

    await navigator.share({
      title: tool.title,
      text: postText,
      url: toolUrl
    });
  }

  const encodedUrl = encodeURIComponent(toolUrl);
  const encodedText = encodeURIComponent(postText);

  return (
    <section className="share-panel tool-share-panel">
      <div>
        <h3>Share the tool</h3>
        <p>No result to save here. It is a browser-only helper, so share the tool itself.</p>
      </div>

      <div className="share-preview">
        <textarea readOnly value={postText} aria-label="Post text" />
      </div>

      <div className="share-actions">
        <button type="button" className="primary-link" onClick={nativeShare}>
          Share tool
        </button>
        <button type="button" className="secondary-button" onClick={() => copy(toolUrl, "Link copied")}>
          Copy link
        </button>
        <button type="button" className="secondary-button" onClick={() => copy(postText, "Text copied")}>
          Copy caption
        </button>
      </div>

      <div className="social-links">
        <a href={`https://twitter.com/intent/tweet?text=${encodedText}`} target="_blank" rel="noreferrer">
          X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`}
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noreferrer"
        >
          Telegram
        </a>
      </div>

      {copyState && <p className="copy-status">{copyState}</p>}
    </section>
  );
}
