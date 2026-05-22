import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppLayout } from "./components/AppLayout.jsx";
import { CategoryPage } from "./pages/CategoryPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { TagPage } from "./pages/TagPage.jsx";
import { ToolIndexPage } from "./pages/ToolIndexPage.jsx";
import { ToolPage } from "./pages/ToolPage.jsx";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/index" element={<ToolIndexPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/results/:id" element={<ResultRedirect />} />
        <Route path="/tags/:tag" element={<TagPage />} />
        <Route path="/tools/:slug" element={<ToolPage />} />
      </Routes>
    </AppLayout>
  );
}

function ResultRedirect() {
  const { id } = useParams();

  return <Navigate to={`/tools/landing-page-first-5-seconds-test?result=${id}`} replace />;
}
