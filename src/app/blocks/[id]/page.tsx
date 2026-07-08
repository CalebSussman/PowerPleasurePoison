import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBlockDetail } from "@/lib/repository";
import { BlockDetailClient } from "@/components/block-detail-client";

export default async function BlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getBlockDetail(id);
  if (!detail) notFound();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 lg:px-6">
        <header className="border-b border-slate-300 pb-4">
          <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
                {detail.block.section.title} / {detail.block.chapter.title}
              </p>
              <h1 className="max-w-5xl text-2xl font-semibold tracking-normal">{detail.block.id}: {detail.block.title}</h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="border border-slate-300 bg-white px-3 py-2">
                <div className="font-mono text-xs text-slate-500">Pages</div>
                <div className="text-lg font-semibold">{detail.block.page_count_label ?? "n/a"}</div>
              </div>
              <div className="border border-slate-300 bg-white px-3 py-2">
                <div className="font-mono text-xs text-slate-500">Support</div>
                <div className="text-lg font-semibold">{detail.block.current_support_level ?? "n/a"}%</div>
              </div>
              <div className="border border-slate-300 bg-white px-3 py-2">
                <div className="font-mono text-xs text-slate-500">Status</div>
                <div className="text-lg font-semibold capitalize">{detail.block.status}</div>
              </div>
            </div>
          </div>
        </header>

        <BlockDetailClient
          block={detail.block}
          initialSources={detail.sources}
          initialDraft={detail.draft}
          initialMapNodes={detail.mapNodes}
          initialMapEdges={detail.mapEdges}
        />
      </div>
    </main>
  );
}
