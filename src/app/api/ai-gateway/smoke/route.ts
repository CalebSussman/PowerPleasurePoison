import { streamText } from "ai";
import { NextRequest } from "next/server";
import { requireWriteAccess } from "@/lib/auth";

const defaultModel = "openai/gpt-5.5";

export async function GET() {
  return Response.json({
    ok: true,
    method: "POST",
    model: process.env.AI_GATEWAY_MODEL ?? defaultModel,
    auth: "Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN server-side.",
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireWriteAccess(request);
  if (unauthorized) return unauthorized;

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json(
      { error: "Missing AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({})) as { prompt?: string };
  const prompt = body.prompt?.trim() || "Reply with a one-sentence status check.";

  const result = streamText({
    model: process.env.AI_GATEWAY_MODEL ?? defaultModel,
    prompt,
    providerOptions: {
      gateway: {
        tags: ["project:power-pleasure-poison", "feature:smoke-test"],
      },
    },
  });

  return result.toTextStreamResponse({
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
