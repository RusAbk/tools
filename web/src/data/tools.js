import { assetPath } from "../utils/paths.js";

export const categories = [
  {
    slug: "utilities",
    name: "Utilities",
    description: "Quick little helpers for counting, cleaning up, checking, or sanity-testing work."
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Small tools for campaigns, content, positioning, and audience research."
  }
];

export const tools = [
  {
    slug: "text-counter",
    title: "Text Counter",
    date: "2026-05-22",
    category: "utilities",
    tags: ["utility", "writing", "browser-only"],
    image: assetPath("tool-covers/text-counter.svg"),
    browserOnly: true,
    interactive: true,
    description: "Drop in text and get instant writing stats without sending anything anywhere.",
    content:
      "A tiny browser-only helper for counting characters, words, sentences, and rough reading time."
  },
  {
    slug: "landing-page-first-5-seconds-test",
    title: "👀 Landing Page First 5 Seconds Test",
    date: "2026-05-22",
    category: "marketing",
    tags: ["landing-pages", "copywriting", "positioning", "clarity"],
    image: assetPath("tool-covers/first-5-seconds-test.svg"),
    interactive: true,
    description:
      "See what a stranger actually understands from your hero section before they bounce.",
    content:
      "Paste a hero section or submit a landing page URL. The tool gives you a fast clarity read: what lands, what feels fuzzy, and what needs a sharper rewrite."
  }
];

export const tags = [...new Set(tools.flatMap((tool) => tool.tags))].sort();
