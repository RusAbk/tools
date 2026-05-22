import React, { useMemo, useState } from "react";
import { ToolSharePanel } from "./ToolSharePanel.jsx";

export function TextCounterTool({ tool }) {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed.match(/\S+/g) || [];
    const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || (trimmed ? [trimmed] : []);

    return {
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      readingTime: Math.ceil(words.length / 220)
    };
  }, [text]);

  return (
    <section className="tool-runner text-counter-tool" id="run-tool">
      <label className="tool-form standalone-field">
        <span>Your text</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste the messy draft, the tiny caption, or that paragraph that somehow became a novel."
          rows={10}
        />
      </label>

      <section className="stats-grid" aria-label="Text statistics">
        <div className="stat-box">
          <strong>{stats.characters}</strong>
          <span>Characters</span>
        </div>
        <div className="stat-box">
          <strong>{stats.words}</strong>
          <span>Words</span>
        </div>
        <div className="stat-box">
          <strong>{stats.sentences}</strong>
          <span>Sentences</span>
        </div>
        <div className="stat-box">
          <strong>{stats.readingTime}</strong>
          <span>Minutes read</span>
        </div>
      </section>

      <ToolSharePanel tool={tool} />
    </section>
  );
}
