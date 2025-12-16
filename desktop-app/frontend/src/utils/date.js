// src/utils/date.js
export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  .toUpperCase();

}