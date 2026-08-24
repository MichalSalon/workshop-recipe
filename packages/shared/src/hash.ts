export async function contentHash(markdown: string): Promise<string> {
  const bytes = new TextEncoder().encode(markdown);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
