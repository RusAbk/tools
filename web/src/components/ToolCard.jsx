import React from "react";
import { Card, Tag } from "antd";
import { Link } from "react-router-dom";

export function ToolCard({ tool }) {
  const body = (
    <>
      <img src={tool.image} alt="" className="tool-image" />
      <div className="tool-card-body">
        <time>{formatDate(tool.date)}</time>
        <h3>{tool.title}</h3>
        <p>{tool.description}</p>
        <div className="tag-row">
          {tool.tags.map((tag) => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <Card className="tool-card">
      <Link to={`/tools/${tool.slug}`} className="tool-card-link">
        {body}
      </Link>
    </Card>
  );
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}
