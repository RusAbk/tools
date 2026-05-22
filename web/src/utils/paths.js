export const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function assetPath(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export function appPath(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${appBasePath}${normalizedPath}`;
}

export function absoluteAppUrl(path = "/") {
  return new URL(appPath(path), window.location.origin).toString();
}
