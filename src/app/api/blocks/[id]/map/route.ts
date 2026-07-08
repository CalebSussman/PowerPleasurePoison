import { NextRequest } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { getBlockMap, replaceBlockMap } from "@/lib/repository";
import type { MapEdgeRecord, MapNodeRecord } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const map = await getBlockMap(id);
  return Response.json(map);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireWriteAccess(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { nodes, edges } = await request.json() as { nodes?: MapNodeRecord[]; edges?: MapEdgeRecord[] };
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return Response.json({ error: "nodes and edges arrays are required." }, { status: 400 });
  }

  try {
    await replaceBlockMap(id, nodes, edges);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Map save failed." }, { status: 500 });
  }
}
