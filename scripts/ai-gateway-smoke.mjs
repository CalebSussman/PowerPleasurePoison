import { streamText } from "ai";

const model = process.env.AI_GATEWAY_MODEL ?? "openai/gpt-5.5";
const prompt = process.argv.slice(2).join(" ") || "Explain quantum computing in simple terms.";

if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
  console.error("Missing AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN.");
  process.exit(1);
}

const result = streamText({
  model,
  prompt,
  providerOptions: {
    gateway: {
      tags: ["project:power-pleasure-poison", "script:smoke-test"],
    },
  },
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

process.stdout.write("\n");
