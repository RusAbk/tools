import React from "react";
import { Breadcrumb } from "antd";
import { Link, useParams } from "react-router-dom";
import { ToolCard } from "../components/ToolCard.jsx";
import { tools } from "../data/tools.js";

export function TagPage() {
  const { tag } = useParams();
  const items = tools.filter((tool) => tool.tags.includes(tag));

  return (
    <article className="page">
      <Breadcrumb
        className="breadcrumbs"
        items={[
          { title: <Link to="/">Home</Link> },
          { title: `#${tag}` }
        ]}
      />
      <header className="page-header">
        <h1>#{tag}</h1>
        <p>{items.length} tools with this tag.</p>
      </header>

      <div className="tool-list">
        {items.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </article>
  );
}
