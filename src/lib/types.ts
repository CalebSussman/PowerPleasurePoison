export type Section = {
  id: string;
  title: string;
  sort_order: number;
};

export type Chapter = {
  id: string;
  section_id: string;
  title: string;
  sort_order: number;
  page_count_label: string | null;
};

export type BlockStatus = "planned" | "research" | "draftable";

export type Block = {
  id: string;
  section_id: string;
  chapter_id: string;
  title: string;
  sort_order: number;
  page_count_label: string | null;
  summary: string | null;
  explanatory_payload: string | null;
  existing_source: string | null;
  research_gaps: string | null;
  current_support_level: number | null;
  status: BlockStatus | string;
  notes: string | null;
  updated_at?: string;
};

export type DashboardRow = Block & {
  section: Section;
  chapter: Chapter;
};

export type Source = {
  id: string;
  zotero_key: string;
  zotero_library_id: string | null;
  title: string | null;
  creators: unknown[];
  date: string | null;
  publication: string | null;
  item_type: string | null;
  url: string | null;
  doi: string | null;
  archive_url: string | null;
  tags: string[];
  collections: string[];
  abstract_note: string | null;
  notes: string | null;
  raw?: unknown;
  updated_at?: string;
};

export type BlockSource = {
  block_id: string;
  source_id: string;
  note: string | null;
  source: Source;
};

export type MapNodeKind = "scene" | "claim" | "source" | "thought" | "transition" | "question";

export type MapNodeRecord = {
  id: string;
  block_id: string;
  node_type: MapNodeKind;
  title: string;
  body: string | null;
  source_id: string | null;
  position_x: number;
  position_y: number;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
};

export type MapEdgeRecord = {
  id: string;
  block_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
  edge_type: string;
  metadata: Record<string, unknown>;
};

export type BlockDraft = {
  block_id: string;
  draft_text: string;
  revision: number;
  updated_at: string;
};
