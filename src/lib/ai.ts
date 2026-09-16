const DEFAULT_BASE = "https://9router.aerisfti.web.id/v1";
const DEFAULT_MODEL = "free-forever";

export function aiConfig() {
  const base = (process.env.AI_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, "");
  const key = process.env.AI_API_KEY?.trim() ?? "";
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  if (!key) throw new Error("AI is not configured. Set AI_API_KEY in .env.");
  return { base, key, model };
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function textFromContent(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        const row = asRecord(part);
        if (!row) return "";
        if (typeof row.text === "string") return row.text;
        if (typeof row.content === "string") return row.content;
        return "";
      })
      .join("")
      .trim();
  }
  const row = asRecord(value);
  if (typeof row?.text === "string") return row.text.trim();
  return "";
}

function extractText(payload: unknown): string {
  const root = asRecord(payload);
  if (!root) return "";

  const choices = Array.isArray(root.choices) ? root.choices : [];
  const choice = asRecord(choices[0]);
  const message = asRecord(choice?.message);
  const fromChoice =
    textFromContent(message?.content) ||
    textFromContent(message?.reasoning_content) ||
    textFromContent(message?.reasoning) ||
    textFromContent(choice?.text);
  if (fromChoice) return fromChoice;

  return (
    textFromContent(root.output_text) ||
    textFromContent(root.content) ||
    textFromContent(root.response) ||
    textFromContent(root.text) ||
    ""
  );
}

export async function chatCompletion(messages: ChatMessage[], options?: { maxTokens?: number }) {
  const { base, key, model } = aiConfig();
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: options?.maxTokens ?? 2048,
      stream: false,
      messages,
    }),
    signal: AbortSignal.timeout(55_000),
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string } | string;
  } | null;

  if (!response.ok) {
    const detail =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.error && typeof payload.error === "object"
          ? payload.error.message
          : null;
    throw new Error(detail?.trim() || `AI request failed (${response.status}).`);
  }

  const content = extractText(payload);
  if (!content) throw new Error("AI returned an empty analysis. Try again in a moment.");
  return { content, model };
}
