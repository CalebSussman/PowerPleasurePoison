import { unstable_noStore as noStore } from "next/cache";
import { getSeedBlock, getSeedDashboardRows } from "@/lib/seed";
import { getSupabaseAdmin, hasSupabaseEnv } from "@/lib/supabase";
import type {
  BlockDraft,
  BlockSource,
  DashboardRow,
  MapEdgeRecord,
  MapNodeRecord,
  Source,
} from "@/lib/types";

type SupabaseBlockRow = Omit<DashboardRow, "section" | "chapter"> & {
  sections: DashboardRow["section"];
  chapters: DashboardRow["chapter"];
};

export async function getDashboardRows(): Promise<DashboardRow[]> {
  noStore();
  if (!hasSupabaseEnv()) return getSeedDashboardRows();

  const { data, error } = await getSupabaseAdmin()
    .from("blocks")
    .select("*, sections(*), chapters(*)")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as SupabaseBlockRow[]).map(({ sections, chapters, ...block }) => ({
    ...block,
    section: sections,
    chapter: chapters,
  }));
}

export async function getBlockDetail(id: string) {
  noStore();
  if (!hasSupabaseEnv()) {
    const block = getSeedBlock(id);
    return block ? { block, sources: [], draft: null, mapNodes: [], mapEdges: [] } : null;
  }

  const supabase = getSupabaseAdmin();
  const [{ data: blockData, error: blockError }, sources, draft, map] = await Promise.all([
    supabase.from("blocks").select("*, sections(*), chapters(*)").eq("id", id).maybeSingle(),
    getBlockSources(id),
    getBlockDraft(id),
    getBlockMap(id),
  ]);

  if (blockError) throw new Error(blockError.message);
  if (!blockData) return null;

  const { sections, chapters, ...block } = blockData as SupabaseBlockRow;
  return {
    block: { ...block, section: sections, chapter: chapters },
    sources,
    draft,
    mapNodes: map.nodes,
    mapEdges: map.edges,
  };
}

export async function getBlockSources(blockId: string): Promise<BlockSource[]> {
  noStore();
  if (!hasSupabaseEnv()) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("block_sources")
    .select("block_id, source_id, note, source:sources(*)")
    .eq("block_id", blockId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BlockSource[];
}

export async function searchSources(query = ""): Promise<Source[]> {
  noStore();
  if (!hasSupabaseEnv()) return [];

  let request = getSupabaseAdmin()
    .from("sources")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);

  const trimmed = query.trim();
  if (trimmed) {
    request = request.or(`title.ilike.%${trimmed}%,zotero_key.ilike.%${trimmed}%,doi.ilike.%${trimmed}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as Source[];
}

export async function attachSource(blockId: string, sourceId: string) {
  const { error } = await getSupabaseAdmin()
    .from("block_sources")
    .upsert({ block_id: blockId, source_id: sourceId }, { onConflict: "block_id,source_id" });
  if (error) throw new Error(error.message);
}

export async function detachSource(blockId: string, sourceId: string) {
  const { error } = await getSupabaseAdmin()
    .from("block_sources")
    .delete()
    .eq("block_id", blockId)
    .eq("source_id", sourceId);
  if (error) throw new Error(error.message);
}

export async function getBlockDraft(blockId: string): Promise<BlockDraft | null> {
  noStore();
  if (!hasSupabaseEnv()) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("block_drafts")
    .select("*")
    .eq("block_id", blockId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BlockDraft | null;
}

export async function saveBlockDraft(blockId: string, draftText: string) {
  const existing = await getBlockDraft(blockId);
  const { data, error } = await getSupabaseAdmin()
    .from("block_drafts")
    .upsert(
      {
        block_id: blockId,
        draft_text: draftText,
        revision: existing ? existing.revision + 1 : 1,
      },
      { onConflict: "block_id" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as BlockDraft;
}

export async function getBlockMap(blockId: string): Promise<{ nodes: MapNodeRecord[]; edges: MapEdgeRecord[] }> {
  noStore();
  if (!hasSupabaseEnv()) return { nodes: [], edges: [] };

  const supabase = getSupabaseAdmin();
  const [{ data: nodes, error: nodeError }, { data: edges, error: edgeError }] = await Promise.all([
    supabase.from("map_nodes").select("*").eq("block_id", blockId),
    supabase.from("map_edges").select("*").eq("block_id", blockId),
  ]);

  if (nodeError) throw new Error(nodeError.message);
  if (edgeError) throw new Error(edgeError.message);
  return { nodes: (nodes ?? []) as MapNodeRecord[], edges: (edges ?? []) as MapEdgeRecord[] };
}

export async function replaceBlockMap(blockId: string, nodes: MapNodeRecord[], edges: MapEdgeRecord[]) {
  const supabase = getSupabaseAdmin();

  const { error: deleteEdgesError } = await supabase.from("map_edges").delete().eq("block_id", blockId);
  if (deleteEdgesError) throw new Error(deleteEdgesError.message);

  const { error: deleteNodesError } = await supabase.from("map_nodes").delete().eq("block_id", blockId);
  if (deleteNodesError) throw new Error(deleteNodesError.message);

  if (nodes.length) {
    const { error } = await supabase.from("map_nodes").insert(nodes.map((node) => ({ ...node, block_id: blockId })));
    if (error) throw new Error(error.message);
  }

  if (edges.length) {
    const { error } = await supabase.from("map_edges").insert(edges.map((edge) => ({ ...edge, block_id: blockId })));
    if (error) throw new Error(error.message);
  }
}
