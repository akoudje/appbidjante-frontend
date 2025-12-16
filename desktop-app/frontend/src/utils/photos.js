export function getPhotoUrl(path) {
  if (!path) return "http://localhost:4000/uploads/default.png";

  if (path.startsWith("http")) return path;

  if (!path.startsWith("/")) path = "/" + path;

  return "http://localhost:4000" + path;
}
