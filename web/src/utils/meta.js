function ensureMeta(selector, createAttributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(createAttributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  return element;
}

export function setPageMeta({ title, description, image }) {
  const absoluteImage = image
    ? new URL(image, window.location.origin).toString()
    : new URL(assetPath("tool-covers/first-5-seconds-test.svg"), window.location.origin).toString();

  document.title = title;

  ensureMeta('meta[name="description"]', { name: "description" }).setAttribute(
    "content",
    description,
  );
  ensureMeta('meta[property="og:title"]', { property: "og:title" }).setAttribute("content", title);
  ensureMeta('meta[property="og:description"]', { property: "og:description" }).setAttribute(
    "content",
    description,
  );
  ensureMeta('meta[property="og:image"]', { property: "og:image" }).setAttribute(
    "content",
    absoluteImage,
  );
  ensureMeta('meta[property="og:type"]', { property: "og:type" }).setAttribute("content", "website");
  ensureMeta('meta[name="twitter:card"]', { name: "twitter:card" }).setAttribute(
    "content",
    "summary_large_image",
  );
}
import { assetPath } from "./paths.js";
