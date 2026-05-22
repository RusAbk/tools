import React from "react";
import { Breadcrumb, Tag } from "antd";
import { Link } from "react-router-dom";
import { ToolCard } from "../components/ToolCard.jsx";
import { categories, tags, tools } from "../data/tools.js";

export function HomePage() {
  return (
    <article className="page">
      <Breadcrumb
        className="breadcrumbs"
        items={[
          {
            title: "Home"
          }
        ]}
      />

      <header className="intro" id="start">
        <p className="eyebrow">Small business tools</p>
        <h1>Practical tools for clearer processes, sharper offers, and repeatable business work.</h1>
        <p>
          I am Ruslan Abkadirov. I work on process optimization and practical AI implementation for
          teams that need less manual coordination and more reliable execution.
        </p>
        <p>
          This catalog collects small utilities I use or prototype around that work: turning rough
          ideas into usable prompts, documenting recurring tasks, checking marketing assets, and
          making everyday decisions less vague.
        </p>
        <p>
          The shared rule: no accounts, no bloated setup, and no mystery dashboard. Open a tool, use
          it, get the thing done.
        </p>
      </header>

      <section className="section article-body" id="about">
        <h2>How to use this catalog</h2>
        <p>
          Start with the category that matches the problem in front of you. Utilities are tiny
          browser-side helpers. Marketing tools are for copy, positioning, and sharper first
          impressions.
        </p>
        <p>
          The goal is not to build a giant software suite. It is to keep useful, focused tools in one
          place so they can be tested, reused, and improved without turning every small workflow into
          a heavy product.
        </p>
      </section>

      <section className="section" id="categories">
        <h2>Categories</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.slug} to={`/categories/${category.slug}`} className="category-card">
              <strong>/{category.name}</strong>
              <span>{category.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="tools">
        <div className="section-title-row">
          <h2>Tool Index</h2>
          <span>{tools.length} items</span>
        </div>
        <div className="tool-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Tags</h2>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <Link key={tag} to={`/tags/${tag}`}>
              <Tag>#{tag}</Tag>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
