import { NextRequest } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { attachSource, detachSource, getBlockSources } from "@/lib/repository";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sources = await getBlockSources(id);
  return Response.json({ sources });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireWriteAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { sourceId } = await request.json();
  if (!sourceId) return Response.json({ error: "sourceId is required." }, { status: 400 });

  try {
    await attachSource(id, sourceId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Attach failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireWriteAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { sourceId } = await request.json();
  if (!sourceId) return Response.json({ error: "sourceId is required." }, { status: 400 });

  try {
    await detachSource(id, sourceId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Detach failed." }, { status: 500 });
  }
}
