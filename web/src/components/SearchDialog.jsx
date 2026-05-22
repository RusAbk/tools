import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { categories, tags, tools } from "../data/tools.js";

const staticPages = [
  {
    type: "Page",
    title: "Home",
    path: "/",
    description: "Project overview, categories, tool index, and tags.",
    content: "small business tools process optimization practical AI implementation"
  },
  {
    type: "Page",
    title: "Index",
    path: "/index",
    description: "A complete list of every published tool.",
    content: "tool index all tools catalog"
  }
];

function buildSearchItems() {
  const categoryItems = categories.map((category) => ({
    type: "Category",
    title: category.name,
    path: `/categories/${category.slug}`,
    description: category.description,
    content: `${category.slug} ${category.description}`
  }));

  const tagItems = tags.map((tag) => ({
    type: "Tag",
    title: `#${tag}`,
    path: `/tags/${tag}`,
    description: `Tools tagged with #${tag}.`,
    content: tag
  }));

  const toolItems = tools.map((tool) => ({
    type: tool.browserOnly ? "Browser tool" : "Tool",
    title: tool.title,
    path: `/tools/${tool.slug}`,
    description: tool.description,
    content: [tool.title, tool.description, tool.content, tool.category, ...tool.tags].join(" "),
    tags: tool.tags
  }));

  return [...staticPages, ...categoryItems, ...toolItems, ...tagItems];
}

function scoreItem(item, query) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return 0;
  }

  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const content = item.content.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (title === token || title === `#${token}`) score += 12;
    if (title.startsWith(token) || title.startsWith(`#${token}`)) score += 8;
    if (title.includes(token)) score += 5;
    if (description.includes(token)) score += 3;
    if (content.includes(token)) score += 2;
  }

  return score;
}

export function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const searchItems = useMemo(buildSearchItems, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return searchItems.slice(0, 8);
    }

    return searchItems
      .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 8)
      .map((result) => result.item);
  }, [query, searchItems]);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }

    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  return (
    <div className="search">
      <button type="button" className="search-button" onClick={() => setIsOpen(true)}>
        <Search size={18} />
        <span>Search</span>
      </button>

      {isOpen && (
        <div className="search-container active" role="dialog" aria-modal="true">
          <div className="search-space">
            <div className="search-field">
              <Search size={19} />
              <input
                ref={inputRef}
                autoComplete="off"
                className="search-bar"
                name="search"
                type="text"
                aria-label="Search tools"
                placeholder="Search tools, categories, and tags"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="button"
                className="search-close"
                aria-label="Close search"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="search-layout display-results">
              <div className="results-container">
                {results.length > 0 ? (
                  results.map((item) => (
                    <Link
                      key={`${item.type}-${item.path}`}
                      to={item.path}
                      className="result-card"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="result-type">{item.type}</span>
                      <h3>{item.title}</h3>
                      <p className="card-description">{item.description}</p>
                      {item.tags && (
                        <div className="result-tags">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="empty-search">No results for “{query}”.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
