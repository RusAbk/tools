import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ResultDisplay } from "./ResultDisplay.jsx";
import { apiUrl } from "../utils/api.js";
import { absoluteAppUrl } from "../utils/paths.js";

function normalizeSavedResult(record) {
  const output = record.output || {};
  const share = record.share || {};
  const resultUrl = absoluteAppUrl(`/results/${record.id}`);
  const score = output.score ?? output.result?.clarityScore;

  return {
    id: record.id,
    resultId: record.id,
    resultUrl,
    model: output.model,
    sourceText: output.sourceText,
    score,
    result: output.result,
    share: {
      ...share,
      url: resultUrl
    }
  };
}

export function LandingPageFirstFiveSecondsTest() {
  const [searchParams] = useSearchParams();
  const savedResultId = searchParams.get("result");
  const [mode, setMode] = useState("url");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSavedResult, setIsLoadingSavedResult] = useState(false);

  useEffect(() => {
    if (!savedResultId) {
      return;
    }

    let isCurrent = true;

    async function loadSavedResult() {
      setIsLoadingSavedResult(true);
      setError("");

      try {
        const response = await fetch(apiUrl(`/api/results/${savedResultId}`));
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || "Could not find that saved result.");
        }

        if (!isCurrent) return;

        const input = payload.input || {};
        const nextMode = input.mode === "url" ? "url" : "text";

        setMode(nextMode);
        setText(input.text || input.extractedText || "");
        setUrl(input.url || "");
        setResult(normalizeSavedResult(payload));
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingSavedResult(false);
        }
      }
    }

    loadSavedResult();

    return () => {
      isCurrent = false;
    };
  }, [savedResultId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/tools/landing-page-first-5-seconds-test"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode, text, url })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Could not read this one. Try pasting the hero copy instead.");
      }

      setResult(payload);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = mode === "url" ? url.trim().length > 0 : text.trim().length >= 40;
  const helperText = useMemo(() => {
    if (!savedResultId) {
      return null;
    }

    return "Loaded a saved run. Tweak the copy or URL and run it again right here.";
  }, [savedResultId]);

  return (
    <section className="tool-runner" id="run-tool">
      {isLoadingSavedResult && <div className="tool-note">Pulling up that saved verdict...</div>}
      {helperText && !isLoadingSavedResult && <div className="tool-note">{helperText}</div>}

      <div className="mode-switch" aria-label="Input type">
        <button
          type="button"
          className={mode === "url" ? "active" : ""}
          onClick={() => setMode("url")}
        >
          Fetch URL
        </button>
        <button
          type="button"
          className={mode === "text" ? "active" : ""}
          onClick={() => setMode("text")}
        >
          Paste copy
        </button>
      </div>

      <form className="tool-form" onSubmit={handleSubmit}>
        {mode === "text" ? (
          <label>
            <span>Hero copy</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Headline, subheadline, CTA, tiny trust line, all the stuff people see before they scroll."
              rows={9}
            />
          </label>
        ) : (
          <label>
            <span>Landing page link</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </label>
        )}

        <button type="submit" className="primary-link tool-submit" disabled={!canSubmit || isLoading}>
          {isLoading ? "Reading the room..." : "Roast my first 5 seconds"}
        </button>
      </form>

      {error && <div className="tool-error">{error}</div>}

      {result && <ResultDisplay result={result} />}
    </section>
  );
}
