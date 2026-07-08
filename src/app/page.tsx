import Link from "next/link";
import { Database, RefreshCw } from "lucide-react";
import { getDashboardRows } from "@/lib/repository";

function statusClass(status: string) {
  if (status === "draftable") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "research") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function Home() {
  const rows = await getDashboardRows();
  const pageTotal = rows.reduce((total, row) => {
    const value = Number.parseFloat(row.page_count_label ?? "0");
    return Number.isFinite(value) ? total + value : total;
  }, 0);
  const researchCount = rows.filter((row) => row.status === "research").length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 lg:px-6">
        <header className="flex flex-col gap-3 border-b border-slate-300 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
              Power, Pleasure, and Poison
            </p>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
              Reframing Dashboard
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="border border-slate-300 bg-white px-3 py-2">
              <div className="font-mono text-xs text-slate-500">Blocks</div>
              <div className="text-lg font-semibold">{rows.length}</div>
            </div>
            <div className="border border-slate-300 bg-white px-3 py-2">
              <div className="font-mono text-xs text-slate-500">Block pages</div>
              <div className="text-lg font-semibold">{pageTotal.toFixed(0)}</div>
            </div>
            <div className="border border-slate-300 bg-white px-3 py-2">
              <div className="font-mono text-xs text-slate-500">Research</div>
              <div className="text-lg font-semibold">{researchCount}</div>
            </div>
          </div>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-white px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Database size={16} />
            <span>Seeded from `Thesis Redraft/Planning/Revised_Reframing.md`; Supabase data appears when env vars are configured.</span>
          </div>
          <Link
            href="/api/sync/zotero"
            className="inline-flex items-center gap-2 border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100"
          >
            <RefreshCw size={15} />
            Sync endpoint
          </Link>
        </section>

        <section className="overflow-hidden border border-slate-300 bg-white">
          <div className="max-h-[calc(100vh-190px)] overflow-auto">
            <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-900 text-xs uppercase tracking-[0.08em] text-white">
                <tr>
                  <th className="w-56 px-3 py-3 font-medium">Section</th>
                  <th className="w-64 px-3 py-3 font-medium">Chapter</th>
                  <th className="w-24 px-3 py-3 font-medium">Ch. pages</th>
                  <th className="w-20 px-3 py-3 font-medium">Block</th>
                  <th className="w-80 px-3 py-3 font-medium">Title</th>
                  <th className="w-24 px-3 py-3 font-medium">Pages</th>
                  <th className="px-3 py-3 font-medium">Summary</th>
                  <th className="w-32 px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-200 align-top hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-800">{row.section.title}</td>
                    <td className="px-3 py-3 text-slate-700">{row.chapter.title}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600">{row.chapter.page_count_label}</td>
                    <td className="px-3 py-3">
                      <Link href={`/blocks/${row.id}`} className="font-mono font-semibold text-slate-950 underline-offset-2 hover:underline">
                        {row.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/blocks/${row.id}`} className="font-medium text-slate-950 underline-offset-2 hover:underline">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-600">{row.page_count_label}</td>
                    <td className="px-3 py-3 leading-5 text-slate-700">{row.summary}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex border px-2 py-1 font-mono text-xs ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
