export function formatWhen(value: number | null): string {
  if (!value) return "recently";
  const date = new Date(value);
  const days = Math.floor((Date.now() - value) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}
