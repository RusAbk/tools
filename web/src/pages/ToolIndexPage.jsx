import React from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { ToolCard } from "../components/ToolCard.jsx";
import { categories, tools } from "../data/tools.js";

export function ToolIndexPage() {
  return (
    <article className="page">
      <Breadcrumb
        className="breadcrumbs"
        items={[
          { title: <Link to="/">Home</Link> },
          { title: "Tool Index" }
        ]}
      />

      <header className="page-header">
        <p className="eyebrow">Index</p>
        <h1>All project tools</h1>
        <p>
          A complete index of browser-only utilities, AI workflows, marketing helpers, and operations
          templates.
        </p>
      </header>

      {categories.map((category) => {
        const items = tools.filter((tool) => tool.category === category.slug);

        if (items.length === 0) {
          return null;
        }

        return (
          <section className="section" key={category.slug}>
            <div className="section-title-row">
              <h2>/{category.name}</h2>
              <span>{items.length} items</span>
            </div>
            <div className="tool-list">
              {items.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}
