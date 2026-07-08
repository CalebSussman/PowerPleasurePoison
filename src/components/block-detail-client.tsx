"use client";

import { useState } from "react";
import { AdminTokenControl } from "@/components/admin-token";
import { MapEditor } from "@/components/map-editor";
import { SourcesTab } from "@/components/sources-tab";
import { TextEditor } from "@/components/text-editor";
import type { BlockDraft, BlockSource, DashboardRow, MapEdgeRecord, MapNodeRecord } from "@/lib/types";

type Tab = "Overview" | "Sources" | "Map" | "Text";
const tabs: Tab[] = ["Overview", "Sources", "Map", "Text"];

export function BlockDetailClient({
  block,
  initialSources,
  initialDraft,
  initialMapNodes,
  initialMapEdges,
}: {
  block: DashboardRow;
  initialSources: BlockSource[];
  initialDraft: BlockDraft | null;
  initialMapNodes: MapNodeRecord[];
  initialMapEdges: MapEdgeRecord[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <section className="min-h-[calc(100vh-170px)] border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-50 px-3 py-2">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border px-3 py-1.5 text-sm font-medium ${
                activeTab === tab
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <AdminTokenControl />
      </div>

      {activeTab === "Overview" && <OverviewTab block={block} />}
      {activeTab === "Sources" && <SourcesTab blockId={block.id} initialSources={initialSources} />}
      {activeTab === "Map" && (
        <MapEditor
          blockId={block.id}
          initialNodes={initialMapNodes}
          initialEdges={initialMapEdges}
          blockTitle={block.title}
        />
      )}
      {activeTab === "Text" && <TextEditor blockId={block.id} initialDraft={initialDraft} />}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 bg-white p-3">
      <dt className="mb-1 font-mono text-xs uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="text-sm leading-6 text-slate-800">{children || <span className="text-slate-400">Empty</span>}</dd>
    </div>
  );
}

function OverviewTab({ block }: { block: DashboardRow }) {
  return (
    <div className="grid gap-3 p-3 xl:grid-cols-[360px_1fr]">
      <dl className="grid gap-3 content-start">
        <Field label="Block ID">{block.id}</Field>
        <Field label="Section">{block.section.title}</Field>
        <Field label="Chapter">{block.chapter.title}</Field>
        <Field label="Block pages">{block.page_count_label}</Field>
        <Field label="Current support">{block.current_support_level === null ? "Unscored" : `${block.current_support_level}%`}</Field>
        <Field label="Status">{block.status}</Field>
      </dl>
      <dl className="grid gap-3">
        <Field label="Summary">{block.summary}</Field>
        <Field label="Explanatory payload">{block.explanatory_payload}</Field>
        <Field label="Research gaps">{block.research_gaps}</Field>
        <Field label="Existing support">{block.existing_source}</Field>
        <Field label="Notes">{block.notes}</Field>
      </dl>
    </div>
  );
}
