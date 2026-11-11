export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid server response.");
  return value as Record<string, unknown>;
}
export function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
export function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
export function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    throw new Error("Invalid numeric value in server response.");
  return value;
}
export function positiveId(value: unknown): number {
  const result = integer(value);
  if (result <= 0) throw new Error("Invalid title identifier.");
  return result;
}
