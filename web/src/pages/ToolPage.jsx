import React, { useEffect } from "react";
import { Breadcrumb, Tag } from "antd";
import { Link, useParams } from "react-router-dom";
import { LandingPageFirstFiveSecondsTest } from "../components/LandingPageFirstFiveSecondsTest.jsx";
import { TextCounterTool } from "../components/TextCounterTool.jsx";
import { formatDate } from "../components/ToolCard.jsx";
import { categories, tools } from "../data/tools.js";
import { setPageMeta } from "../utils/meta.js";

export function ToolPage() {
  const { slug } = useParams();
  const tool = tools.find((item) => item.slug === slug);

  useEffect(() => {
    if (!tool) return;

    setPageMeta({
      title: `${tool.title} | Ruslan Abkadirov Tools`,
      description: tool.description,
      image: tool.image
    });
  }, [tool]);

  if (!tool) {
    return (
      <article className="page">
        <h1>Tool not found</h1>
        <Link to="/">Back home</Link>
      </article>
    );
  }

  const category = categories.find((item) => item.slug === tool.category);

  return (
    <article className="page tool-detail">
      <Breadcrumb
        className="breadcrumbs"
        items={[
          { title: <Link to="/">Home</Link> },
          { title: <Link to={`/categories/${category.slug}`}>{category.name}</Link> },
          { title: tool.title }
        ]}
      />
      <header className="page-header">
        <time>{formatDate(tool.date)}</time>
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <div className="tag-row">
          {tool.tags.map((tag) => (
            <Link key={tag} to={`/tags/${tag}`}>
              <Tag>#{tag}</Tag>
            </Link>
          ))}
        </div>
      </header>

      <section className="article-body">
        {tool.slug === "landing-page-first-5-seconds-test" ? (
          <p className="tool-hook">
            Your hero has about <strong>5 seconds</strong> before a visitor mentally wanders off to
            snacks, Slack, or sixteen open tabs. Drop in the copy, and this little test tells you
            what actually lands, what feels fuzzy, and which lines need a cleaner punch.
          </p>
        ) : tool.slug === "text-counter" ? (
          <p className="tool-hook">
            Paste text, get the numbers, move on with your life. Characters, words, sentences, and
            rough reading time update instantly, and <strong>nothing leaves your browser</strong>.
          </p>
        ) : (
          <>
            <h2>What it does</h2>
            <p>{tool.content}</p>
          </>
        )}
        {tool.slug === "text-counter" ? (
          <>
            <h2>Instructions</h2>
            <ol>
              <li>Paste or type your text into the box.</li>
              <li>Watch the stats update instantly.</li>
              <li>Share the tool if someone else is also fighting a suspiciously long paragraph.</li>
            </ol>
            <TextCounterTool tool={tool} />
          </>
        ) : tool.url ? (
          <>
            <h2>Launch</h2>
            <p>
              This tool is a standalone HTML page. It runs in the browser and does not call the
              backend.
            </p>
            <a className="primary-link" href={tool.url}>
              Open tool
            </a>
          </>
        ) : tool.slug === "landing-page-first-5-seconds-test" ? (
          <>
            <h2>Instructions</h2>
            <ol>
              <li>Paste your hero copy, or toss in a URL if you want the tool to fetch the page.</li>
              <li>Hit the button and let the tiny judgment machine do its thing.</li>
              <li>Steal the useful notes, fix the fuzzy bits, and share the score if you dare.</li>
            </ol>
            <LandingPageFirstFiveSecondsTest />
          </>
        ) : (
          <>
            <h2>How this will work</h2>
            <p>
              The frontend will collect the inputs, then call the backend endpoint that keeps the
              OpenRouter API key on the server. This keeps the public UI simple without exposing paid
              credentials in the browser.
            </p>
          </>
        )}
      </section>
    </article>
  );
}
