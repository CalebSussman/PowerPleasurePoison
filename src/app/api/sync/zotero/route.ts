import { NextRequest } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type ZoteroCreator = {
  creatorType?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
};

type ZoteroItem = {
  key: string;
  data: {
    key?: string;
    itemType?: string;
    title?: string;
    creators?: ZoteroCreator[];
    date?: string;
    publicationTitle?: string;
    bookTitle?: string;
    proceedingsTitle?: string;
    websiteTitle?: string;
    publisher?: string;
    url?: string;
    DOI?: string;
    archive?: string;
    archiveLocation?: string;
    tags?: { tag: string }[];
    collections?: string[];
    abstractNote?: string;
    note?: string;
    extra?: string;
  };
};

export async function GET() {
  return Response.json({
    ok: true,
    method: "POST",
    required_env: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "ZOTERO_API_KEY",
      "ZOTERO_LIBRARY_ID",
      "ZOTERO_LIBRARY_TYPE",
    ],
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = requireWriteAccess(request);
  if (unauthorized) return unauthorized;

  const apiKey = process.env.ZOTERO_API_KEY;
  const libraryId = process.env.ZOTERO_LIBRARY_ID;
  const libraryType = process.env.ZOTERO_LIBRARY_TYPE;

  if (!apiKey || !libraryId || !libraryType) {
    return Response.json({ error: "Missing Zotero env vars." }, { status: 500 });
  }

  if (libraryType !== "user" && libraryType !== "group") {
    return Response.json({ error: "ZOTERO_LIBRARY_TYPE must be user or group." }, { status: 500 });
  }

  let supabase;
  let runId: string | null = null;

  try {
    supabase = getSupabaseAdmin();
    const { data: run, error: runError } = await supabase
      .from("sync_runs")
      .insert({ provider: "zotero", status: "running" })
      .select("*")
      .single();

    if (runError) throw new Error(runError.message);
    runId = run.id;

    const items = await fetchZoteroItems({ apiKey, libraryId, libraryType });
    const rows = items
      .filter((item) => item.key && item.data.itemType !== "attachment")
      .map((item) => {
        const data = item.data;
        return {
          zotero_key: item.key,
          zotero_library_id: libraryId,
          title: data.title ?? null,
          creators: data.creators ?? [],
          date: data.date ?? null,
          publication: data.publicationTitle ?? data.bookTitle ?? data.proceedingsTitle ?? data.websiteTitle ?? data.publisher ?? null,
          item_type: data.itemType ?? null,
          url: data.url ?? null,
          doi: data.DOI ?? null,
          archive_url: data.archiveLocation ?? data.archive ?? null,
          tags: (data.tags ?? []).map((tag) => tag.tag).filter(Boolean),
          collections: data.collections ?? [],
          abstract_note: data.abstractNote ?? null,
          notes: data.note ?? data.extra ?? null,
          raw: item,
        };
      });

    if (rows.length) {
      const { error } = await supabase.from("sources").upsert(rows, { onConflict: "zotero_key" });
      if (error) throw new Error(error.message);
    }

    await supabase
      .from("sync_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        fetched_count: items.length,
        upserted_count: rows.length,
      })
      .eq("id", run.id);

    return Response.json({ ok: true, fetched_count: items.length, upserted_count: rows.length });
  } catch (error) {
    if (supabase && runId) {
      await supabase
        .from("sync_runs")
        .update({
          status: "error",
          finished_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
        .eq("id", runId);
    }
    return Response.json({ error: error instanceof Error ? error.message : "Zotero sync failed." }, { status: 500 });
  }
}

async function fetchZoteroItems({
  apiKey,
  libraryId,
  libraryType,
}: {
  apiKey: string;
  libraryId: string;
  libraryType: "user" | "group";
}) {
  const base = `https://api.zotero.org/${libraryType}s/${libraryId}/items`;
  const allItems: ZoteroItem[] = [];
  let start = 0;
  let total = Number.POSITIVE_INFINITY;

  while (start < total) {
    const url = new URL(base);
    url.searchParams.set("format", "json");
    url.searchParams.set("include", "data");
    url.searchParams.set("limit", "100");
    url.searchParams.set("start", String(start));

    const response = await fetch(url, {
      headers: {
        "Zotero-API-Key": apiKey,
        "Zotero-API-Version": "3",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Zotero API ${response.status}: ${await response.text()}`);
    }

    total = Number(response.headers.get("Total-Results") ?? "0");
    const batch = await response.json() as ZoteroItem[];
    allItems.push(...batch);
    if (batch.length === 0) break;
    start += batch.length;
  }

  return allItems;
}
