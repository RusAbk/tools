import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.resolve(__dirname, "../results");

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
}

function parseDevice(userAgent = "") {
  const lower = userAgent.toLowerCase();
  const deviceType = /ipad|tablet/.test(lower)
    ? "tablet"
    : /mobile|iphone|android/.test(lower)
      ? "mobile"
      : "desktop";

  const os = /windows/.test(lower)
    ? "Windows"
    : /mac os|macintosh/.test(lower)
      ? "macOS"
      : /android/.test(lower)
        ? "Android"
        : /iphone|ipad|ios/.test(lower)
          ? "iOS"
          : /linux/.test(lower)
            ? "Linux"
            : "Unknown";

  const browser = /edg\//.test(lower)
    ? "Edge"
    : /chrome|crios/.test(lower)
      ? "Chrome"
      : /firefox|fxios/.test(lower)
        ? "Firefox"
        : /safari/.test(lower)
          ? "Safari"
          : "Unknown";

  return { type: deviceType, os, browser };
}

function getRequestMetadata(req) {
  const userAgent = req.headers["user-agent"] || "";

  return {
    ip: getClientIp(req),
    userAgent,
    device: parseDevice(userAgent),
    browser: parseDevice(userAgent).browser,
    language: req.headers["accept-language"] || null,
    referrer: req.headers.referer || req.headers.referrer || null,
    location: {
      country:
        req.headers["cf-ipcountry"] ||
        req.headers["x-vercel-ip-country"] ||
        req.headers["cloudfront-viewer-country"] ||
        null,
      region: req.headers["x-vercel-ip-country-region"] || null,
      city: req.headers["x-vercel-ip-city"] || null,
      timezone: req.headers["x-vercel-ip-timezone"] || null
    },
    headers: {
      host: req.headers.host || null,
      origin: req.headers.origin || null,
      forwardedFor: req.headers["x-forwarded-for"] || null
    }
  };
}

export async function saveToolResult({ req, tool, input, output, share }) {
  await mkdir(resultsDir, { recursive: true });

  const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const record = {
    id,
    createdAt: new Date().toISOString(),
    tool,
    request: getRequestMetadata(req),
    input,
    output,
    share
  };

  await writeFile(path.join(resultsDir, `${id}.json`), JSON.stringify(record, null, 2));

  return record;
}

export async function updateToolResult(record) {
  await mkdir(resultsDir, { recursive: true });
  await writeFile(path.join(resultsDir, `${record.id}.json`), JSON.stringify(record, null, 2));
  return record;
}

export async function readToolResult(id) {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return null;
  }

  try {
    const raw = await readFile(path.join(resultsDir, `${id}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function escapeSvg(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxLength) {
  const words = String(text).replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (`${currentLine} ${word}`.trim().length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = `${currentLine} ${word}`.trim();
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

export function buildShareImageSvg(record) {
  const score = record.output?.score ?? record.output?.result?.clarityScore;
  const title = (record.share?.title || record.tool?.name || "Tool result").replace("👀", "").trim();
  const verdict = record.share?.summary || "Saved tool result";
  const scoreText = typeof score === "number" ? `${score}/100` : "Saved";
  const titleLines = wrapText(title, 28).slice(0, 2);
  const verdictLines = wrapText(verdict, 46).slice(0, 4);
  const progressWidth = Math.max(18, Math.min(360, ((score || 0) / 100) * 360));

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B0F12"/>
      <stop offset="100%" stop-color="#17201E"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="56" width="1080" height="518" rx="38" fill="#FBFBF9" filter="url(#shadow)"/>
  <rect x="100" y="96" width="168" height="34" rx="17" fill="#DFF7F3"/>
  <text x="124" y="119" fill="#0F766E" font-family="Arial, sans-serif" font-size="18" font-weight="800">5-second test</text>
  ${titleLines
    .map(
      (line, index) =>
        `<text x="100" y="${190 + index * 56}" fill="#111827" font-family="Arial, sans-serif" font-size="44" font-weight="900">${escapeSvg(line)}</text>`,
    )
    .join("")}
  <rect x="800" y="104" width="290" height="326" rx="30" fill="#0F766E"/>
  <circle cx="945" cy="210" r="78" fill="#FFFFFF" fill-opacity="0.14"/>
  <text x="945" y="223" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="64" font-weight="900">${escapeSvg(scoreText)}</text>
  <text x="945" y="274" text-anchor="middle" fill="#DFF7F3" font-family="Arial, sans-serif" font-size="24" font-weight="800">clarity score</text>
  <rect x="865" y="328" width="160" height="42" rx="21" fill="#FFFFFF" fill-opacity="0.16"/>
  <text x="945" y="356" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="20" font-weight="800">first glance</text>
  ${verdictLines
    .map(
      (line, index) =>
        `<text x="100" y="${326 + index * 38}" fill="#374151" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeSvg(line)}</text>`,
    )
    .join("")}
  <rect x="100" y="488" width="360" height="18" rx="9" fill="#E7E2DA"/>
  <rect x="100" y="488" width="${progressWidth}" height="18" rx="9" fill="#0F766E"/>
  <text x="100" y="540" fill="#8B8F96" font-family="Arial, sans-serif" font-size="22" font-weight="800">ruslanabkadirov.me/tools</text>
  <text x="802" y="540" fill="#8B8F96" font-family="Arial, sans-serif" font-size="20" font-weight="700">Share your result, then fix the fuzzy bits.</text>
</svg>`;
}
