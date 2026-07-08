"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { getAdminHeaders } from "@/components/admin-token";
import type { BlockDraft } from "@/lib/types";

export function TextEditor({ blockId, initialDraft }: { blockId: string; initialDraft: BlockDraft | null }) {
  const [text, setText] = useState(initialDraft?.draft_text ?? "");
  const [status, setStatus] = useState(initialDraft ? `Revision ${initialDraft.revision}` : "No saved draft");

  async function save() {
    setStatus("Saving...");
    const response = await fetch(`/api/blocks/${blockId}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...getAdminHeaders() },
      body: JSON.stringify({ draftText: text }),
    });
    const body = await response.json();
    setStatus(response.ok ? `Saved revision ${body.draft.revision}` : body.error ?? "Save failed.");
  }

  return (
    <div className="grid min-h-[calc(100vh-230px)] grid-rows-[auto_1fr] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-xs uppercase tracking-[0.12em] text-slate-500">{status}</div>
        <button onClick={save} className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          <Save size={15} />
          Save draft
        </button>
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-[560px] w-full resize-none border border-slate-300 bg-white p-4 font-serif text-base leading-7 outline-none focus:border-slate-900"
        placeholder="Draft this block here..."
      />
    </div>
  );
}
