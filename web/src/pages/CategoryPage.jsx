import React from "react";
import { Breadcrumb } from "antd";
import { Link, useParams } from "react-router-dom";
import { ToolCard } from "../components/ToolCard.jsx";
import { categories, tools } from "../data/tools.js";

export function CategoryPage() {
  const { slug } = useParams();
  const category = categories.find((item) => item.slug === slug);
  const items = tools.filter((tool) => tool.category === slug);

  if (!category) {
    return <NotFound title="Category not found" />;
  }

  return (
    <article className="page">
      <Breadcrumb
        className="breadcrumbs"
        items={[
          { title: <Link to="/">Home</Link> },
          { title: category.name }
        ]}
      />
      <header className="page-header">
        <h1>{category.name}</h1>
        <p>{category.description}</p>
        <p>{items.length} items under this folder.</p>
      </header>

      <div className="tool-list">
        {items.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </article>
  );
}

function NotFound({ title }) {
  return (
    <article className="page">
      <h1>{title}</h1>
      <Link to="/">Back home</Link>
    </article>
  );
}
