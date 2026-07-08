create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.sections (
  id text primary key,
  title text not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id text primary key,
  section_id text not null references public.sections(id) on delete cascade,
  title text not null,
  sort_order integer not null,
  page_count_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id text primary key,
  section_id text not null references public.sections(id) on delete cascade,
  chapter_id text not null references public.chapters(id) on delete cascade,
  title text not null,
  sort_order integer not null,
  page_count_label text,
  summary text,
  explanatory_payload text,
  existing_source text,
  research_gaps text,
  current_support_level integer check (current_support_level is null or (current_support_level >= 0 and current_support_level <= 100)),
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  zotero_key text not null unique,
  zotero_library_id text,
  title text,
  creators jsonb not null default '[]'::jsonb,
  date text,
  publication text,
  item_type text,
  url text,
  doi text,
  archive_url text,
  tags text[] not null default '{}',
  collections text[] not null default '{}',
  abstract_note text,
  notes text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.block_sources (
  block_id text not null references public.blocks(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (block_id, source_id)
);

create table if not exists public.map_nodes (
  id uuid primary key default gen_random_uuid(),
  block_id text not null references public.blocks(id) on delete cascade,
  node_type text not null check (node_type in ('scene', 'claim', 'source', 'thought', 'transition', 'question')),
  title text not null default '',
  body text,
  source_id uuid references public.sources(id) on delete set null,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  width double precision,
  height double precision,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.map_edges (
  id uuid primary key default gen_random_uuid(),
  block_id text not null references public.blocks(id) on delete cascade,
  source_node_id uuid not null references public.map_nodes(id) on delete cascade,
  target_node_id uuid not null references public.map_nodes(id) on delete cascade,
  label text,
  edge_type text not null default 'supports',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint map_edges_distinct_nodes check (source_node_id <> target_node_id)
);

create table if not exists public.block_drafts (
  block_id text primary key references public.blocks(id) on delete cascade,
  draft_text text not null default '',
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  block_id text references public.blocks(id) on delete cascade,
  source_id uuid references public.sources(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_have_parent check (block_id is not null or source_id is not null)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'zotero',
  status text not null check (status in ('running', 'success', 'error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  upserted_count integer not null default 0,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chapters_section_sort_idx on public.chapters(section_id, sort_order);
create index if not exists blocks_chapter_sort_idx on public.blocks(chapter_id, sort_order);
create index if not exists sources_zotero_key_idx on public.sources(zotero_key);
create index if not exists sources_title_idx on public.sources using gin (to_tsvector('simple', coalesce(title, '')));
create index if not exists block_sources_source_idx on public.block_sources(source_id);
create index if not exists map_nodes_block_idx on public.map_nodes(block_id);
create index if not exists map_edges_block_idx on public.map_edges(block_id);
create index if not exists notes_block_idx on public.notes(block_id);

drop trigger if exists set_sections_updated_at on public.sections;
create trigger set_sections_updated_at before update on public.sections for each row execute function public.set_updated_at();
drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at before update on public.chapters for each row execute function public.set_updated_at();
drop trigger if exists set_blocks_updated_at on public.blocks;
create trigger set_blocks_updated_at before update on public.blocks for each row execute function public.set_updated_at();
drop trigger if exists set_sources_updated_at on public.sources;
create trigger set_sources_updated_at before update on public.sources for each row execute function public.set_updated_at();
drop trigger if exists set_block_sources_updated_at on public.block_sources;
create trigger set_block_sources_updated_at before update on public.block_sources for each row execute function public.set_updated_at();
drop trigger if exists set_map_nodes_updated_at on public.map_nodes;
create trigger set_map_nodes_updated_at before update on public.map_nodes for each row execute function public.set_updated_at();
drop trigger if exists set_map_edges_updated_at on public.map_edges;
create trigger set_map_edges_updated_at before update on public.map_edges for each row execute function public.set_updated_at();
drop trigger if exists set_block_drafts_updated_at on public.block_drafts;
create trigger set_block_drafts_updated_at before update on public.block_drafts for each row execute function public.set_updated_at();
drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at before update on public.notes for each row execute function public.set_updated_at();
drop trigger if exists set_sync_runs_updated_at on public.sync_runs;
create trigger set_sync_runs_updated_at before update on public.sync_runs for each row execute function public.set_updated_at();

alter table public.sections enable row level security;
alter table public.chapters enable row level security;
alter table public.blocks enable row level security;
alter table public.sources enable row level security;
alter table public.block_sources enable row level security;
alter table public.map_nodes enable row level security;
alter table public.map_edges enable row level security;
alter table public.block_drafts enable row level security;
alter table public.notes enable row level security;
alter table public.sync_runs enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.sections, public.chapters, public.blocks, public.sources, public.block_sources, public.map_nodes, public.map_edges, public.block_drafts, public.notes, public.sync_runs to anon, authenticated;
grant insert, update, delete on public.block_sources, public.map_nodes, public.map_edges, public.block_drafts, public.notes to authenticated;

drop policy if exists "public read sections" on public.sections;
create policy "public read sections" on public.sections for select to anon, authenticated using (true);
drop policy if exists "public read chapters" on public.chapters;
create policy "public read chapters" on public.chapters for select to anon, authenticated using (true);
drop policy if exists "public read blocks" on public.blocks;
create policy "public read blocks" on public.blocks for select to anon, authenticated using (true);
drop policy if exists "public read sources" on public.sources;
create policy "public read sources" on public.sources for select to anon, authenticated using (true);
drop policy if exists "public read block_sources" on public.block_sources;
create policy "public read block_sources" on public.block_sources for select to anon, authenticated using (true);
drop policy if exists "public read map_nodes" on public.map_nodes;
create policy "public read map_nodes" on public.map_nodes for select to anon, authenticated using (true);
drop policy if exists "public read map_edges" on public.map_edges;
create policy "public read map_edges" on public.map_edges for select to anon, authenticated using (true);
drop policy if exists "public read block_drafts" on public.block_drafts;
create policy "public read block_drafts" on public.block_drafts for select to anon, authenticated using (true);
drop policy if exists "public read notes" on public.notes;
create policy "public read notes" on public.notes for select to anon, authenticated using (true);
drop policy if exists "public read sync_runs" on public.sync_runs;
create policy "public read sync_runs" on public.sync_runs for select to anon, authenticated using (true);

-- Mutations are performed through Next.js server routes with the service role key.
-- No service role key is exposed to browser code.
