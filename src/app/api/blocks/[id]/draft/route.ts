import { NextRequest } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { getBlockDraft, saveBlockDraft } from "@/lib/repository";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await getBlockDraft(id);
  return Response.json({ draft });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireWriteAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { draftText } = await request.json();
  if (typeof draftText !== "string") return Response.json({ error: "draftText must be a string." }, { status: 400 });

  try {
    const draft = await saveBlockDraft(id, draftText);
    return Response.json({ draft });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Draft save failed." }, { status: 500 });
  }
}
