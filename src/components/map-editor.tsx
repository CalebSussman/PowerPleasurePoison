"use client";

import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { getAdminHeaders } from "@/components/admin-token";
import type { MapEdgeRecord, MapNodeKind, MapNodeRecord } from "@/lib/types";

const kinds: MapNodeKind[] = ["scene", "claim", "source", "thought", "transition", "question"];

const kindClass: Record<MapNodeKind, string> = {
  scene: "border-sky-500 bg-sky-50",
  claim: "border-emerald-500 bg-emerald-50",
  source: "border-violet-500 bg-violet-50",
  thought: "border-slate-500 bg-slate-50",
  transition: "border-orange-500 bg-orange-50",
  question: "border-rose-500 bg-rose-50",
};

function toFlowNode(record: MapNodeRecord): Node {
  return {
    id: record.id,
    type: "default",
    position: { x: record.position_x, y: record.position_y },
    data: {
      label: (
        <div className={`min-w-44 max-w-64 border-l-4 px-2 py-1 ${kindClass[record.node_type]}`}>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{record.node_type}</div>
          <div className="text-xs font-semibold text-slate-950">{record.title || "Untitled node"}</div>
          {record.body && <div className="mt-1 text-[11px] leading-4 text-slate-600">{record.body}</div>}
          {record.source_id && <div className="mt-1 font-mono text-[10px] text-violet-700">source linked</div>}
        </div>
      ),
      nodeType: record.node_type,
      title: record.title,
      body: record.body,
      sourceId: record.source_id,
    },
  };
}

function toFlowEdge(record: MapEdgeRecord): Edge {
  return {
    id: record.id,
    source: record.source_node_id,
    target: record.target_node_id,
    label: record.label ?? undefined,
    animated: record.edge_type === "question",
  };
}

function fromFlowNode(blockId: string, node: Node): MapNodeRecord {
  const data = node.data as { nodeType?: MapNodeKind; title?: string; body?: string | null; sourceId?: string | null };
  return {
    id: node.id,
    block_id: blockId,
    node_type: data.nodeType ?? "thought",
    title: data.title ?? "Untitled node",
    body: data.body ?? null,
    source_id: data.sourceId ?? null,
    position_x: node.position.x,
    position_y: node.position.y,
    width: node.measured?.width ?? null,
    height: node.measured?.height ?? null,
    metadata: {},
  };
}

function fromFlowEdge(blockId: string, edge: Edge): MapEdgeRecord {
  return {
    id: edge.id,
    block_id: blockId,
    source_node_id: edge.source,
    target_node_id: edge.target,
    label: typeof edge.label === "string" ? edge.label : null,
    edge_type: edge.animated ? "question" : "supports",
    metadata: {},
  };
}

export function MapEditor({
  blockId,
  blockTitle,
  initialNodes,
  initialEdges,
}: {
  blockId: string;
  blockTitle: string;
  initialNodes: MapNodeRecord[];
  initialEdges: MapEdgeRecord[];
}) {
  const seededNodes = useMemo(() => {
    if (initialNodes.length) return initialNodes.map(toFlowNode);
    return [
      toFlowNode({
        id: crypto.randomUUID(),
        block_id: blockId,
        node_type: "scene",
        title: blockTitle,
        body: "Opening scene or working center of gravity.",
        source_id: null,
        position_x: 80,
        position_y: 80,
        width: null,
        height: null,
        metadata: {},
      }),
    ];
  }, [blockId, blockTitle, initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(seededNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toFlowEdge));
  const [kind, setKind] = useState<MapNodeKind>("claim");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [status, setStatus] = useState("Unsaved map changes stay in this session until saved.");

  function onConnect(connection: Connection) {
    setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
  }

  function addNode() {
    const id = crypto.randomUUID();
    const node = toFlowNode({
      id,
      block_id: blockId,
      node_type: kind,
      title: title || `${kind} node`,
      body: body || null,
      source_id: kind === "source" && sourceId ? sourceId : null,
      position_x: 140 + nodes.length * 28,
      position_y: 140 + nodes.length * 22,
      width: null,
      height: null,
      metadata: {},
    });
    setNodes((current) => current.concat(node));
    setTitle("");
    setBody("");
    setSourceId("");
  }

  async function save() {
    setStatus("Saving map...");
    const response = await fetch(`/api/blocks/${blockId}/map`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...getAdminHeaders() },
      body: JSON.stringify({
        nodes: nodes.map((node) => fromFlowNode(blockId, node)),
        edges: edges.map((edge) => fromFlowEdge(blockId, edge)),
      }),
    });
    const payload = await response.json();
    setStatus(response.ok ? "Map saved." : payload.error ?? "Map save failed.");
  }

  return (
    <ReactFlowProvider>
      <div className="grid min-h-[calc(100vh-230px)] grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-slate-300 bg-slate-50 p-3 lg:border-b-0 lg:border-r">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Blackboard node</h2>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Type
            <select value={kind} onChange={(event) => setKind(event.target.value as MapNodeKind)} className="mt-1 w-full border border-slate-300 bg-white px-2 py-2 text-sm">
              {kinds.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" />
          </label>
          <label className="mb-2 block text-xs font-medium text-slate-600">
            Body
            <textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 h-24 w-full resize-none border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" />
          </label>
          {kind === "source" && (
            <label className="mb-2 block text-xs font-medium text-slate-600">
              Source UUID
              <input value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="mt-1 w-full border border-slate-300 px-2 py-2 font-mono text-xs outline-none focus:border-slate-900" />
            </label>
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={addNode} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">
              <Plus size={15} />
              Add
            </button>
            <button onClick={save} className="inline-flex items-center gap-2 border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              <Save size={15} />
              Save
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{status}</p>
        </aside>
        <div className="h-[calc(100vh-230px)] min-h-[620px] bg-[#111827]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#475569" gap={18} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
