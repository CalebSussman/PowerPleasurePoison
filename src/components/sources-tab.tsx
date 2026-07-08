"use client";

import { Link2, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getAdminHeaders } from "@/components/admin-token";
import type { BlockSource, Source } from "@/lib/types";

function creatorLabel(creators: unknown[]) {
  return creators
    .map((creator) => {
      if (!creator || typeof creator !== "object") return "";
      const item = creator as { firstName?: string; lastName?: string; name?: string };
      return item.name ?? [item.firstName, item.lastName].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .slice(0, 3)
    .join("; ");
}

export function SourcesTab({ blockId, initialSources }: { blockId: string; initialSources: BlockSource[] }) {
  const [attached, setAttached] = useState(initialSources);
  const [results, setResults] = useState<Source[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const attachedIds = useMemo(() => new Set(attached.map((item) => item.source_id)), [attached]);

  async function refreshAttached() {
    const response = await fetch(`/api/blocks/${blockId}/sources`);
    const body = await response.json();
    setAttached(body.sources ?? []);
  }

  async function search() {
    setMessage("Searching sources...");
    const response = await fetch(`/api/sources?q=${encodeURIComponent(query)}`);
    const body = await response.json();
    setResults(body.sources ?? []);
    setMessage("");
  }

  async function syncZotero() {
    setMessage("Syncing Zotero...");
    const response = await fetch("/api/sync/zotero", {
      method: "POST",
      headers: { "content-type": "application/json", ...getAdminHeaders() },
    });
    const body = await response.json();
    setMessage(response.ok ? `Synced ${body.upserted_count ?? 0} sources.` : body.error ?? "Sync failed.");
    if (response.ok) await search();
  }

  async function attach(sourceId: string) {
    const response = await fetch(`/api/blocks/${blockId}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json", ...getAdminHeaders() },
      body: JSON.stringify({ sourceId }),
    });
    if (!response.ok) {
      setMessage((await response.json()).error ?? "Attach failed.");
      return;
    }
    await refreshAttached();
  }

  async function detach(sourceId: string) {
    const response = await fetch(`/api/blocks/${blockId}/sources`, {
      method: "DELETE",
      headers: { "content-type": "application/json", ...getAdminHeaders() },
      body: JSON.stringify({ sourceId }),
    });
    if (!response.ok) {
      setMessage((await response.json()).error ?? "Detach failed.");
      return;
    }
    await refreshAttached();
  }

  return (
    <div className="grid min-h-[calc(100vh-230px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="border-b border-slate-300 p-3 lg:border-b-0 lg:border-r">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Attached sources</h2>
          <button onClick={syncZotero} className="inline-flex items-center gap-2 border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
            <RefreshCw size={15} />
            Sync Zotero
          </button>
        </div>
        {message && <div className="mb-3 border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div>}
        <div className="grid gap-2">
          {attached.length === 0 && <div className="border border-dashed border-slate-300 p-6 text-sm text-slate-500">No sources attached to this block yet.</div>}
          {attached.map(({ source }) => (
            <SourceRow key={source.id} source={source} action={
              <button onClick={() => detach(source.id)} className="border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Detach source">
                <Trash2 size={15} />
              </button>
            } />
          ))}
        </div>
      </div>
      <aside className="p-3">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Find Zotero source</h2>
        <div className="mb-3 flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void search();
            }}
            className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            placeholder="Title, DOI, Zotero key"
          />
          <button onClick={search} className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            <Search size={15} />
            Search
          </button>
        </div>
        <div className="grid gap-2">
          {results.map((source) => (
            <SourceRow key={source.id} source={source} action={
              <button
                onClick={() => attach(source.id)}
                disabled={attachedIds.has(source.id)}
                className="border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Attach source"
              >
                <Link2 size={15} />
              </button>
            } />
          ))}
        </div>
      </aside>
    </div>
  );
}

function SourceRow({ source, action }: { source: Source; action: React.ReactNode }) {
  return (
    <article className="border border-slate-300 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase text-slate-500">{source.item_type ?? "item"}</span>
            <span className="font-mono text-xs text-slate-400">{source.zotero_key}</span>
          </div>
          <h3 className="text-sm font-semibold leading-5 text-slate-950">{source.title ?? "Untitled source"}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">{creatorLabel(source.creators)} {source.date ? `(${source.date})` : ""}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{source.publication}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {source.doi && <span className="border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">DOI {source.doi}</span>}
            {source.url && <a href={source.url} target="_blank" rel="noreferrer" className="border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-slate-50">URL</a>}
            {source.archive_url && <a href={source.archive_url} target="_blank" rel="noreferrer" className="border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-slate-50">ARCHIVE</a>}
          </div>
          {source.tags.length > 0 && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{source.tags.join(", ")}</p>}
          {source.notes && <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{source.notes}</p>}
        </div>
        {action}
      </div>
    </article>
  );
}
