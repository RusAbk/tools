import React, { useMemo, useState } from "react";
import { apiUrl } from "../utils/api.js";
import { absoluteAppUrl } from "../utils/paths.js";

function renderInlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function MarkdownResult({ content }) {
  const nodes = [];
  const lines = String(content || "")
    .split("\n")
    .filter((line) => !/^clarity score\s*:/i.test(line.trim()));
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    nodes.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    nodes.push({ type: "list", items: list });
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "heading", text: line.slice(3) });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return (
    <div className="markdown-result">
      {nodes.map((node, nodeIndex) => {
        if (node.type === "heading") {
          return <h3 key={nodeIndex}>{renderInlineMarkdown(node.text)}</h3>;
        }

        if (node.type === "list") {
          return (
            <ul key={nodeIndex}>
              {node.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        return <p key={nodeIndex}>{renderInlineMarkdown(node.text)}</p>;
      })}
    </div>
  );
}

function StructuredResult({ content }) {
  const rewriteExample = content.rewriteExample || {};
  const rewriteItems = [
    ["Headline", rewriteExample.headline],
    ["Subheadline", rewriteExample.subheadline],
    ["CTA", rewriteExample.cta],
    ["Proof/risk line", rewriteExample.proofRiskLine]
  ].filter(([, value]) => value);

  return (
    <div className="markdown-result">
      {content.verdict && <p><strong>5-second verdict:</strong> {content.verdict}</p>}

      <h3>What is unclear?</h3>
      {content.whatIsUnclear?.length > 0 ? (
        <ul>
          {content.whatIsUnclear.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No unclear points returned.</p>
      )}

      <h3>Priority fixes</h3>
      {content.priorityFixes?.length > 0 ? (
        <ul>
          {content.priorityFixes.map((fix, index) => (
            <li key={index}>
              <strong>{fix.element}:</strong> {fix.problem} {"->"} {fix.change}
            </li>
          ))}
        </ul>
      ) : (
        <p>No priority fixes returned.</p>
      )}

      <h3>Rewrite example</h3>
      {rewriteItems.length > 0 ? (
        <ul>
          {rewriteItems.map(([label, value]) => (
            <li key={label}>
              <strong>{label}:</strong> {value}
            </li>
          ))}
        </ul>
      ) : (
        <p>No rewrite example returned.</p>
      )}
    </div>
  );
}

export function ScoreGauge({ score }) {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return null;
  }

  const label =
    numericScore >= 80 ? "Clear" : numericScore >= 60 ? "Needs tightening" : "Hard to understand";

  return (
    <div className="score-gauge" style={{ "--score": numericScore }}>
      <div className="score-gauge-top">
        <span>Clarity score</span>
        <strong>{numericScore}/100</strong>
      </div>
      <div className="score-track" aria-hidden="true">
        <div className="score-fill" />
      </div>
      <div className="score-scale">
        <span>Confusing</span>
        <span>{label}</span>
        <span>Instantly clear</span>
      </div>
    </div>
  );
}

export function SharePanel({ result }) {
  const [copyState, setCopyState] = useState("");
  const share = result.share || {};
  const score = result.score ?? result.result?.clarityScore;
  const resultUrl =
    result.resultId || result.id
      ? absoluteAppUrl(`/results/${result.resultId || result.id}`)
      : share.url || result.resultUrl || window.location.href;
  const socialShareUrl = share.sharePagePath ? apiUrl(share.sharePagePath) : resultUrl;
  const imageUrl = share.imagePath ? apiUrl(share.imagePath) : "";
  const postText = useMemo(() => {
    const scoreText = Number.isFinite(Number(score)) ? `${Number(score)}/100` : "pretty mysterious";
    const summary = share.summary || "My hero section got a quick clarity check.";

    return [
      `Вау! Только что проверил свой лендинг на понятность за первые 5 секунд, и мой результат: ${scoreText}.`,
      summary,
      `Посмотри мой результат и попробуй свой лендинг тут: ${resultUrl}`
    ].join("\n");
  }, [score, resultUrl, share.summary]);

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
      title: share.title || "Landing page clarity result",
      text: postText,
      url: resultUrl
    });
  }

  async function openSocialShare(platform) {
    const encodedUrl = encodeURIComponent(socialShareUrl);
    const encodedResultUrl = encodeURIComponent(resultUrl);
    const encodedText = encodeURIComponent(postText);
    let url = "";

    if (platform === "x") {
      url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    }

    if (platform === "linkedin") {
      navigator.clipboard
        .writeText(postText)
        .then(() => {
          setCopyState("Caption copied. Paste it into LinkedIn.");
          window.setTimeout(() => setCopyState(""), 1800);
        })
        .catch(() => {});
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    }

    if (platform === "facebook") {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    }

    if (platform === "telegram") {
      url = `https://t.me/share/url?url=${encodedResultUrl}&text=${encodedText}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="share-panel">
      <div>
        <h3>Post your score</h3>
        <p>Pick a network. The caption is ready, the saved link is included, and the score image comes with the preview.</p>
      </div>

      <div className="share-preview">
        {imageUrl && <img src={imageUrl} alt="" />}
        <textarea readOnly value={postText} aria-label="Post text" />
      </div>

      <div className="share-actions">
        <button type="button" className="primary-link" onClick={nativeShare}>
          Share it
        </button>
        <button type="button" className="secondary-button" onClick={() => copy(resultUrl, "Link copied")}>
          Copy link
        </button>
        <button type="button" className="secondary-button" onClick={() => copy(postText, "Text copied")}>
          Copy caption
        </button>
        {imageUrl && (
          <a className="secondary-button" href={imageUrl} target="_blank" rel="noreferrer">
            Open score image
          </a>
        )}
      </div>

      <div className="social-links">
        <button type="button" onClick={() => openSocialShare("x")}>
          X
        </button>
        <button type="button" onClick={() => openSocialShare("linkedin")}>
          LinkedIn
        </button>
        <button type="button" onClick={() => openSocialShare("facebook")}>
          Facebook
        </button>
        <button type="button" onClick={() => openSocialShare("telegram")}>
          Telegram
        </button>
      </div>

      {copyState && <p className="copy-status">{copyState}</p>}
    </section>
  );
}

export function ResultDisplay({ result, showShare = true }) {
  const isStructuredResult = result.result && typeof result.result === "object";
  const score = result.score ?? result.result?.clarityScore;

  return (
    <div className="tool-result">
      <div className="section-title-row">
        <h2>The verdict</h2>
      </div>
      <ScoreGauge score={score} />
      {isStructuredResult ? (
        <StructuredResult content={result.result} />
      ) : (
        <MarkdownResult content={result.result} />
      )}
      {showShare && <SharePanel result={result} />}
    </div>
  );
}
