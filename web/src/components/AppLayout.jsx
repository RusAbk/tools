import React, { useState } from "react";
import { BookOpen, ChevronDown, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { SearchDialog } from "./SearchDialog.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { categories, tools } from "../data/tools.js";
import { assetPath } from "../utils/paths.js";

export function AppLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="shell">
      <aside className={`sidebar${isMenuOpen ? " menu-open" : ""}`}>
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <Menu size={20} />
        </button>

        <NavLink className="site-brand" to="/" onClick={closeMenu}>
          <span className="site-name">Ruslan Abkadirov</span>
          <span className="site-kicker">Tools</span>
          <img src={assetPath("profile-image.jpg")} alt="Ruslan Abkadirov" width="96" height="96" />
        </NavLink>

        <a className="root-site-link" href="https://ruslanabkadirov.me/">
          Main site
        </a>

        <div className="toolbar">
          <SearchDialog />
          <ThemeToggle />
          <NavLink to="/index" className="icon-button" aria-label="Tool index" onClick={closeMenu}>
            <BookOpen size={20} />
          </NavLink>
        </div>

        <button type="button" className="mobile-menu-backdrop" aria-label="Close navigation" onClick={closeMenu} />

        <nav className="explorer" aria-label="Tools">
          <div className="explorer-title">
            <h2>Tools</h2>
            <ChevronDown size={15} />
          </div>

          <ul className="explorer-list">
            <li>
              <NavLink to="/" onClick={closeMenu}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/index" onClick={closeMenu}>
                Index
              </NavLink>
            </li>
          </ul>

          <ul className="explorer-list folder-list">
            {categories.map((category) => {
              const items = tools.filter((tool) => tool.category === category.slug);

              return (
                <li className="folder" key={category.slug}>
                  <NavLink to={`/categories/${category.slug}`} className="folder-link" onClick={closeMenu}>
                    <ChevronDown size={13} />
                    <span>{category.name}</span>
                  </NavLink>
                  {items.length > 0 && (
                    <ul>
                      {items.map((tool) => (
                        <li key={tool.slug}>
                          <NavLink to={`/tools/${tool.slug}`} onClick={closeMenu}>
                            {tool.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
