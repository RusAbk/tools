import "dotenv/config";
import cors from "cors";
import express from "express";
import { categories, tags, tools } from "./data.js";
import {
  buildShareImageSvg,
  readToolResult,
  saveToolResult,
  updateToolResult
} from "./resultStore.js";

const app = express();
const port = process.env.PORT || 4000;
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:5173";
const webBasePath = (process.env.WEB_BASE_PATH || "/tools").replace(/\/$/, "");
const defaultOpenRouterModel = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";

app.use(cors({ origin: webOrigin }));
app.use(express.json({ limit: "1mb" }));

function webUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${webOrigin}${webBasePath}${normalizedPath}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/tools", (req, res) => {
  const { category, tag } = req.query;
  let result = tools;

  if (category) {
    result = result.filter((tool) => tool.category === category);
  }

  if (tag) {
    result = result.filter((tool) => tool.tags.includes(tag));
  }

  res.json(result);
});

app.get("/api/tools/:slug", (req, res) => {
  const tool = tools.find((item) => item.slug === req.params.slug);

  if (!tool) {
    res.status(404).json({ message: "Tool not found" });
    return;
  }

  res.json(tool);
});

app.get("/api/categories", (_req, res) => {
  res.json(categories);
});

app.get("/api/categories/:slug", (req, res) => {
  const category = categories.find((item) => item.slug === req.params.slug);

  if (!category) {
    res.status(404).json({ message: "Category not found" });
    return;
  }

  res.json({
    ...category,
    tools: tools.filter((tool) => tool.category === category.slug)
  });
});

app.get("/api/tags", (_req, res) => {
  res.json(tags);
});

app.get("/api/tags/:tag", (req, res) => {
  const tag = req.params.tag;

  res.json({
    tag,
    tools: tools.filter((tool) => tool.tags.includes(tag))
  });
});

function validatePublicUrl(rawUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { error: "Enter a valid URL." };
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { error: "Only http and https URLs are supported." };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
  const privateIpPattern =
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|127\.|0\.)/;

  if (blockedHosts.includes(hostname) || privateIpPattern.test(hostname)) {
    return { error: "Private and local URLs are not supported." };
  }

  return { url: parsedUrl };
}

function extractVisibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(h1|h2|h3|p|div|section|header|main|li|button|a)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchLandingPageText(rawUrl) {
  const validation = validatePublicUrl(rawUrl);

  if (validation.error) {
    return { error: validation.error };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(validation.url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 LandingPageFirst5SecondsTest/1.0"
      }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      return { error: `The page returned HTTP ${response.status}.` };
    }

    if (!contentType.includes("text/html")) {
      return { error: "The URL did not return an HTML page." };
    }

    const html = await response.text();
    const text = extractVisibleText(html).slice(0, 4500);

    if (text.length < 80) {
      return { error: "Could not extract enough visible text from the page." };
    }

    return { text };
  } catch (error) {
    const message =
      error.name === "AbortError" ? "The page took too long to respond." : "Could not fetch the URL.";
    return { error: message };
  } finally {
    clearTimeout(timeout);
  }
}

function buildFiveSecondPrompt(inputText, sourceType) {
  return [
    {
      role: "system",
      content:
        "You are a sharp landing page clarity reviewer. Simulate what a cold visitor understands in the first 5 seconds. Start with an engaging, specific verdict that makes the user want to keep reading. Give concrete rewrite guidance, not generic CRO advice. Do not invent missing product details; if a detail is missing, name the missing detail and show a fill-in placeholder."
    },
    {
      role: "user",
      content: `Source: ${sourceType}

Hero / first-screen text:
"""${inputText.slice(0, 4500)}"""

Return one valid JSON object only. Do not wrap it in markdown. Do not add commentary before or after it.

Use exactly this shape:
{
  "clarityScore": 0,
  "verdict": "one vivid sentence that captures the main clarity problem or strength",
  "whatIsUnclear": ["1-3 bullets"],
  "priorityFixes": [
    {
      "element": "headline | subheadline | CTA | proof | audience | offer | pricing | risk reversal | next step",
      "problem": "specific problem",
      "change": "specific change"
    }
  ],
  "rewriteExample": {
    "headline": "paste-ready headline",
    "subheadline": "paste-ready subheadline",
    "cta": "paste-ready CTA",
    "proofRiskLine": "optional paste-ready proof or risk line"
  }
}

Rules for the last two sections:
- In "priorityFixes", each object must name one exact element to fix: headline, subheadline, CTA, proof, audience, offer, pricing, risk reversal, or next step.
- Each "priorityFixes" object must include both the problem and the concrete change.
- In "rewriteExample", write a complete first-screen version the founder can paste into a draft: headline, subheadline, CTA, and optionally proof/risk line.
- If the source does not include enough product detail to write a confident line, use a bracketed placeholder like [specific outcome], [target customer], or [proof point] instead of inventing facts.

Score based on how quickly a cold visitor can understand the offer, audience, value, and next action. Make the bullets specific enough that the founder can rewrite the hero immediately. Use plain English. Be direct. Avoid vague advice like "make it clearer", "add more value", or "improve the CTA" unless you also say exactly what to write. If a section cannot be answered from the text, say what is missing.`
    }
  ];
}

function stripJsonFence(content) {
  return String(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseFiveSecondJson(content) {
  const cleaned = stripJsonFence(content);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model did not return a JSON object.");
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function toStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 3);
}

function normalizeFiveSecondResult(value) {
  const rawScore = Number(value?.clarityScore);
  const clarityScore = Number.isFinite(rawScore)
    ? Math.min(100, Math.max(0, Math.round(rawScore)))
    : null;
  const priorityFixes = Array.isArray(value?.priorityFixes)
    ? value.priorityFixes
        .map((item) => ({
          element: String(item?.element || "").trim(),
          problem: String(item?.problem || "").trim(),
          change: String(item?.change || "").trim()
        }))
        .filter((item) => item.element && item.problem && item.change)
        .slice(0, 3)
    : [];
  const rewriteExample = value?.rewriteExample || {};
  const normalized = {
    clarityScore,
    verdict: String(value?.verdict || "").trim(),
    whatIsUnclear: toStringList(value?.whatIsUnclear),
    priorityFixes,
    rewriteExample: {
      headline: String(rewriteExample.headline || "").trim(),
      subheadline: String(rewriteExample.subheadline || "").trim(),
      cta: String(rewriteExample.cta || "").trim(),
      proofRiskLine: String(rewriteExample.proofRiskLine || "").trim()
    }
  };

  if (normalized.clarityScore === null) {
    throw new Error("Model JSON is missing clarityScore.");
  }

  if (!normalized.verdict) {
    throw new Error("Model JSON is missing verdict.");
  }

  return normalized;
}

function extractClarityScore(content) {
  const match = content.match(/clarity score\s*:\s*(\d{1,3})\s*\/\s*100/i);

  if (!match) {
    return null;
  }

  const score = Number(match[1]);

  if (!Number.isFinite(score)) {
    return null;
  }

  return Math.min(100, Math.max(0, score));
}

function extractVerdict(content) {
  const match = content.match(/\*\*5-second verdict:\*\*\s*(.+)/i);

  if (match) {
    return match[1].trim();
  }

  return content
    .replace(/clarity score\s*:\s*\d{1,3}\s*\/\s*100/i, "")
    .replace(/[#*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.get("/api/results/:id", async (req, res) => {
  const record = await readToolResult(req.params.id);

  if (!record) {
    res.status(404).json({ message: "Result not found" });
    return;
  }

  res.json(record);
});

app.get("/api/results/:id/share-image.svg", async (req, res) => {
  const record = await readToolResult(req.params.id);

  if (!record) {
    res.status(404).json({ message: "Result not found" });
    return;
  }

  res.type("image/svg+xml").send(buildShareImageSvg(record));
});

app.get("/api/results/:id/share", async (req, res) => {
  const record = await readToolResult(req.params.id);

  if (!record) {
    res.status(404).send("Result not found");
    return;
  }

  const resultUrl = webUrl(`/results/${record.id}`);
  const imageUrl = `${webOrigin}/api/results/${record.id}/share-image.svg`;
  const title = `${record.output?.score ?? "Saved"}/100 Landing Page Clarity Result`;
  const description = record.share?.summary || "Saved landing page clarity result.";

  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(resultUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(resultUrl)}" />
    <link rel="canonical" href="${escapeHtml(resultUrl)}" />
  </head>
  <body>
    <p><a href="${escapeHtml(resultUrl)}">Open result</a></p>
  </body>
</html>`);
});

app.post("/api/tools/landing-page-first-5-seconds-test", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.status(500).json({ message: "OPENROUTER_API_KEY is not configured" });
    return;
  }

  const { mode, text = "", url = "" } = req.body;
  let inputText = "";
  let sourceType = "pasted text";

  if (mode === "text") {
    inputText = String(text).trim().slice(0, 4500);
  } else if (mode === "url") {
    const result = await fetchLandingPageText(String(url).trim());

    if (result.error) {
      res.status(400).json({ message: result.error });
      return;
    }

    inputText = result.text;
    sourceType = `URL: ${url}`;
  } else {
    res.status(400).json({ message: "mode must be text or url" });
    return;
  }

  if (inputText.length < 40) {
    res.status(400).json({ message: "Add at least 40 characters of hero section text." });
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": webOrigin,
        "X-Title": "Landing Page First 5 Seconds Test"
      },
      body: JSON.stringify({
        model: defaultOpenRouterModel,
        messages: buildFiveSecondPrompt(inputText, sourceType),
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 1000
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        message: payload?.error?.message || "OpenRouter request failed",
        detail: payload
      });
      return;
    }

    const rawResult = payload.choices?.[0]?.message?.content || "";
    const result = normalizeFiveSecondResult(parseFiveSecondJson(rawResult));
    const score = result.clarityScore;
    const savedResult = await saveToolResult({
      req,
      tool: {
        slug: "landing-page-first-5-seconds-test",
        name: "👀 Landing Page First 5 Seconds Test"
      },
      input: {
        mode,
        text: mode === "text" ? inputText : undefined,
        url: mode === "url" ? url : undefined,
        extractedText: mode === "url" ? inputText : undefined
      },
      output: {
        model: payload.model || defaultOpenRouterModel,
        sourceText: inputText.slice(0, 1200),
        score,
        result,
        rawResult
      },
      share: {
        title: "👀 Landing Page First 5 Seconds Test",
        summary: result.verdict || "Landing page clarity result",
        url: null,
        imagePath: null
      }
    });

    savedResult.share.url = webUrl(`/results/${savedResult.id}`);
    savedResult.share.imagePath = `/api/results/${savedResult.id}/share-image.svg`;
    savedResult.share.sharePagePath = `/api/results/${savedResult.id}/share`;
    await updateToolResult(savedResult);

    res.json({
      id: savedResult.id,
      resultId: savedResult.id,
      resultUrl: savedResult.share.url,
      model: savedResult.output.model,
      sourceText: savedResult.output.sourceText,
      score: savedResult.output.score,
      result: savedResult.output.result,
      share: savedResult.share
    });
  } catch (error) {
    res.status(502).json({ message: "OpenRouter request failed", detail: error.message });
  }
});

app.post("/api/openrouter/chat", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    res.status(500).json({ message: "OPENROUTER_API_KEY is not configured" });
    return;
  }

  const { messages, model = defaultOpenRouterModel } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ message: "messages must be a non-empty array" });
    return;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": webOrigin,
        "X-Title": "Weekly Business Tools"
      },
      body: JSON.stringify({ model, messages })
    });

    const payload = await response.json();
    res.status(response.status).json(payload);
  } catch (error) {
    res.status(502).json({ message: "OpenRouter request failed", detail: error.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
