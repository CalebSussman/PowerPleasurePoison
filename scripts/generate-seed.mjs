import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.resolve(root, "../Thesis Redraft/Planning/Revised_Reframing.md");
const dataPath = path.resolve(root, "src/data/seed-blocks.json");
const sqlPath = path.resolve(root, "supabase/seed/001_reframing_blocks.sql");

const markdown = fs.readFileSync(sourcePath, "utf8");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sql(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const tableRows = markdown
  .split(/\r?\n/)
  .filter((line) => line.startsWith("| "))
  .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
  .filter((cells) => cells.length === 10 && /^B\d+$/.test(cells[3]));

const sections = [];
const chapters = [];
const blocks = [];
const seenSections = new Map();
const seenChapters = new Map();

for (const cells of tableRows) {
  const [
    sectionTitle,
    chapterTitle,
    chapterPageCount,
    blockId,
    blockTitle,
    blockPageCount,
    explanatoryPayload,
    existingSource,
    researchGaps,
    statusNotes,
  ] = cells;

  if (!seenSections.has(sectionTitle)) {
    const id = slugify(sectionTitle || "section");
    seenSections.set(sectionTitle, id);
    sections.push({
      id,
      title: sectionTitle,
      sort_order: sections.length + 1,
    });
  }

  const sectionId = seenSections.get(sectionTitle);
  const chapterKey = `${sectionId}::${chapterTitle}`;
  if (!seenChapters.has(chapterKey)) {
    const ordinal = chapters.length + 1;
    const id = chapterTitle === "Dramatis Personae"
      ? "intro"
      : chapterTitle === "The Ice Wells"
        ? "epilogue"
        : `ch-${String(ordinal - 1).padStart(2, "0")}`;
    seenChapters.set(chapterKey, id);
    chapters.push({
      id,
      section_id: sectionId,
      title: chapterTitle,
      sort_order: chapters.length + 1,
      page_count_label: chapterPageCount,
    });
  }

  const chapterId = seenChapters.get(chapterKey);
  const supportMatch = statusNotes.match(/~?(\d+)% present/i);
  const currentSupportLevel = supportMatch ? Number(supportMatch[1]) : null;
  const status = /research-dependent|under-supported|needs research/i.test(statusNotes)
    ? "research"
    : /strong|workable|good/i.test(statusNotes)
      ? "draftable"
      : "planned";

  blocks.push({
    id: blockId,
    section_id: sectionId,
    chapter_id: chapterId,
    title: blockTitle,
    sort_order: Number(blockId.replace("B", "")),
    page_count_label: blockPageCount,
    summary: explanatoryPayload.split(". ").slice(0, 2).join(". "),
    explanatory_payload: explanatoryPayload,
    existing_source: existingSource,
    research_gaps: researchGaps,
    current_support_level: currentSupportLevel,
    status,
    notes: statusNotes,
  });
}

const generated = {
  generated_from: "Thesis Redraft/Planning/Revised_Reframing.md",
  generated_at: new Date().toISOString(),
  sections,
  chapters,
  blocks,
};

fs.writeFileSync(dataPath, `${JSON.stringify(generated, null, 2)}\n`);

const statements = [];
statements.push("-- Generated from Thesis Redraft/Planning/Revised_Reframing.md");
statements.push("begin;");
statements.push(
  `insert into public.sections (id, title, sort_order) values\n${sections
    .map((s) => `  (${sql(s.id)}, ${sql(s.title)}, ${s.sort_order})`)
    .join(",\n")}\non conflict (id) do update set title = excluded.title, sort_order = excluded.sort_order, updated_at = now();`,
);
statements.push(
  `insert into public.chapters (id, section_id, title, sort_order, page_count_label) values\n${chapters
    .map((c) => `  (${sql(c.id)}, ${sql(c.section_id)}, ${sql(c.title)}, ${c.sort_order}, ${sql(c.page_count_label)})`)
    .join(",\n")}\non conflict (id) do update set section_id = excluded.section_id, title = excluded.title, sort_order = excluded.sort_order, page_count_label = excluded.page_count_label, updated_at = now();`,
);
statements.push(
  `insert into public.blocks (id, section_id, chapter_id, title, sort_order, page_count_label, summary, explanatory_payload, existing_source, research_gaps, current_support_level, status, notes) values\n${blocks
    .map((b) => `  (${sql(b.id)}, ${sql(b.section_id)}, ${sql(b.chapter_id)}, ${sql(b.title)}, ${b.sort_order}, ${sql(b.page_count_label)}, ${sql(b.summary)}, ${sql(b.explanatory_payload)}, ${sql(b.existing_source)}, ${sql(b.research_gaps)}, ${b.current_support_level ?? "null"}, ${sql(b.status)}, ${sql(b.notes)})`)
    .join(",\n")}\non conflict (id) do update set section_id = excluded.section_id, chapter_id = excluded.chapter_id, title = excluded.title, sort_order = excluded.sort_order, page_count_label = excluded.page_count_label, summary = excluded.summary, explanatory_payload = excluded.explanatory_payload, existing_source = excluded.existing_source, research_gaps = excluded.research_gaps, current_support_level = excluded.current_support_level, status = excluded.status, notes = excluded.notes, updated_at = now();`,
);
statements.push("commit;");

fs.writeFileSync(sqlPath, `${statements.join("\n\n")}\n`);

console.log(`Generated ${sections.length} sections, ${chapters.length} chapters, ${blocks.length} blocks.`);
